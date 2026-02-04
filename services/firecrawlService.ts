
import { aiBridge } from './aiBridge';

export interface FirecrawlResult {
    url: string;
    email?: string;
    website?: string;
}

export const firecrawlService = {
    async searchAndScrape(razaoSocial: string, cnpj: string): Promise<FirecrawlResult | null> {
        const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
        if (!apiKey) {
            console.warn("Firecrawl API Key missing");
            return null;
        }

        try {
            // 1. Search for the official website
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

            if (!searchResponse.ok) return null;
            const searchData = await searchResponse.json();

            if (!searchData.data || searchData.data.length === 0) return null;

            const officialUrl = searchData.data[0].url;

            // 2. Use Proxy (Jina/Firecrawl Fallback)
            const markdown = await this.scrapeUrl(officialUrl);

            return {
                url: officialUrl,
                website: officialUrl,
                markdown: markdown
            } as any;

        } catch (error) {
            console.error("Firecrawl Error:", error);
            return null;
        }
    },

    async scrapeUrl(url: string): Promise<string | null> {
        try {
            const res = await aiBridge.callAiFunction('scrapeUrl', { url });
            return res.markdown || null;
        } catch (error) {
            console.error("Scrape Error via Proxy:", error);
            return null;
        }
    },

    async searchByNiche(query: string): Promise<any[]> {
        const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
        if (!apiKey) {
            console.warn("Firecrawl API Key missing");
            return [];
        }

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

            if (!response.ok) return [];
            const data = await response.json();
            return data.data || [];
        } catch (error) {
            console.error("Firecrawl Search Error:", error);
            return [];
        }
    }
};
