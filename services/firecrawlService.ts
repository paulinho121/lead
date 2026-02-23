
import { jinaService } from './jinaService';
import { scraperService } from './scraperService';
import { serperService } from './serperService';

export interface FirecrawlResult {
    url: string;
    email?: string;
    website?: string;
    markdown?: string;
}

export const firecrawlService = {
    async searchAndScrape(razaoSocial: string, cnpj: string, customKeys?: { serper?: string, firecrawl?: string }): Promise<FirecrawlResult | null> {
        try {
            // 1. Search via Serper (Priority)
            const query = `${razaoSocial} ${cnpj} site oficial`;
            const serperResults = await serperService.search(query, 1, customKeys?.serper);

            let officialUrl: string | undefined;

            if (serperResults && serperResults.length > 0) {
                officialUrl = serperResults[0].url;
            } else {
                console.warn('Serper found no results, trying Jina Search fallback...');
                // Fallback to Jina Search
                const jinaSearchUrl = `https://s.jina.ai/${encodeURIComponent(query)}`;
                const jinaRes = await fetch(jinaSearchUrl, { headers: { 'Accept': 'text/plain' } });

                if (jinaRes.ok) {
                    const content = await jinaRes.text();
                    const urlMatch = content.match(/https?:\/\/[^\s\)]+/);
                    if (urlMatch) {
                        officialUrl = urlMatch[0];
                    }
                }
            }

            if (!officialUrl) {
                // Try Firecrawl Search as last resort if credits exist
                const firecrawlKey = customKeys?.firecrawl || import.meta.env.VITE_FIRECRAWL_API_KEY;
                if (firecrawlKey) {
                    const fcRes = await fetch('https://api.firecrawl.dev/v1/search', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${firecrawlKey}` },
                        body: JSON.stringify({ query, limit: 1 })
                    });
                    if (fcRes.ok) {
                        const fcData = await fcRes.json();
                        officialUrl = fcData.data?.[0]?.url;
                    }
                }
            }

            if (!officialUrl) return null;

            // 2. Scrape via Jina (Free & Efficient)
            const markdown = await jinaService.scrapeUrl(officialUrl);

            return {
                url: officialUrl,
                website: officialUrl,
                markdown: markdown || ""
            };

        } catch (error: any) {
            console.error("Enrichment Search Error:", error);
            throw error;
        }
    },

    async scrapeUrl(url: string, customFirecrawlKey?: string): Promise<string | null> {
        // Tenta Jina primeiro (Ela costuma aceitar chamadas de navegador melhor que a Firecrawl)
        try {
            const jinaResult = await jinaService.scrapeUrl(url);
            if (jinaResult) return jinaResult;
        } catch (e) {
            console.warn("Jina Scrape failed, trying Firecrawl fallback...", e);
        }

        // Fallback para Firecrawl (direto)
        const apiKey = customFirecrawlKey || import.meta.env.VITE_FIRECRAWL_API_KEY;
        if (!apiKey) return null;

        try {
            const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    url,
                    formats: ['markdown'],
                    onlyMainContent: false
                })
            });

            if (!response.ok) {
                if (response.status === 402) {
                    console.warn("Firecrawl 402: Payment Required. Returning null.");
                    return null;
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Firecrawl Error ${response.status}`);
            }
            const data = await response.json();
            return data.data?.markdown || null;
        } catch (error: any) {
            console.error("Firecrawl Extraction Error:", error);
            throw error; // Rethrow to be caught by UI
        }
    },

    async searchByNiche(query: string, customKeys?: { serper?: string, firecrawl?: string }): Promise<any[]> {
        // 1. Serper Search (Priority)
        try {
            const serperResults = await serperService.search(`${query} empresas brasil`, 15, customKeys?.serper);
            if (serperResults.length > 0) {
                return serperResults.map(r => ({
                    url: r.url,
                    razaoSocial: r.title,
                    snippet: r.snippet
                }));
            }
        } catch (err) {
            console.error("Serper Niche Search Error:", err);
        }

        // 2. Firecrawl Search (Fallback 1)
        const apiKey = customKeys?.firecrawl || import.meta.env.VITE_FIRECRAWL_API_KEY;

        if (apiKey) {
            try {
                const response = await fetch('https://api.firecrawl.dev/v1/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        query: `${query} empresas brasil`,
                        limit: 15,
                        lang: 'pt'
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.data || [];
                }

                if (response.status === 402) {
                    console.warn("Firecrawl Payment Required, falling back to Jina...");
                }
            } catch (error) {
                console.error("Firecrawl Search Error:", error);
            }
        }

        // 3. Fallback to Jina Search if Firecrawl fails or API key is missing
        try {
            console.log("Using Jina Search fallback for query:", query);
            const jinaSearchUrl = `https://s.jina.ai/${encodeURIComponent(query + ' empresas brasil')}`;
            const response = await fetch(jinaSearchUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'text/plain'
                }
            });

            if (response.ok) {
                const text = await response.text();
                // Return as a single "result" that contains the markdown, 
                // Gemini extractLeadsFromText will handle parsing this unstructured text.
                return [{ content: text, url: jinaSearchUrl }];
            }
        } catch (jinaError) {
            console.error("Jina Search Fallback Error:", jinaError);
        }

        // Fallback 2: Open Source Search (DuckDuckGo via scraperService)
        try {
            console.log("Using Open Source Search (DuckDuckGo) fallback for query:", query);
            const freeResults = await scraperService.freeSearch(query);
            if (freeResults.length > 0) {
                return freeResults;
            }
        } catch (freeError) {
            console.error("Free Search Fallback Error:", freeError);
        }

        return [];
    }
};
