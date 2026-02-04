
import { jinaService } from './jinaService';
import { scraperService } from './scraperService';

export interface FirecrawlResult {
    url: string;
    email?: string;
    website?: string;
}

export const firecrawlService = {
    async searchAndScrape(razaoSocial: string, cnpj: string): Promise<FirecrawlResult | null> {
        const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
        if (!apiKey) return null;

        try {
            // 1. Search (Navegador pode chamar a busca da Firecrawl direto)
            const searchResponse = await fetch('https://api.firecrawl.dev/v1/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    query: `${razaoSocial} ${cnpj} site oficial`,
                    limit: 1,
                    lang: 'pt'
                })
            });

            if (!searchResponse.ok) {
                if (searchResponse.status === 402) throw new Error('Firecrawl 402: Payment Required');
                return null;
            }
            const searchData = await searchResponse.json();
            if (!searchData.data || searchData.data.length === 0) return null;

            const officialUrl = searchData.data[0].url;

            // 2. Scrape via Jina (Já configurado para rodar no navegador)
            const markdown = await jinaService.scrapeUrl(officialUrl);

            return {
                url: officialUrl,
                website: officialUrl,
                markdown: markdown
            } as any;

        } catch (error: any) {
            console.error("Firecrawl Error:", error);
            throw error;
        }
    },

    async scrapeUrl(url: string): Promise<string | null> {
        // Tenta Jina primeiro (Ela costuma aceitar chamadas de navegador melhor que a Firecrawl)
        try {
            const jinaResult = await jinaService.scrapeUrl(url);
            if (jinaResult) return jinaResult;
        } catch (e) {
            console.warn("Jina Scrape failed, trying Firecrawl fallback...", e);
        }

        // Fallback para Firecrawl (direto)
        const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
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

    async searchByNiche(query: string): Promise<any[]> {
        const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;

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

        // Fallback to Jina Search if Firecrawl fails or API key is missing
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
