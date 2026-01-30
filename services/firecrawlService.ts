
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

            // 2. Scrape the official website to extract info
            const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    url: officialUrl,
                    formats: ['markdown'],
                    onlyMainContent: true
                })
            });

            if (!scrapeResponse.ok) return { url: officialUrl };
            const scrapeData = await scrapeResponse.json();

            // Here you could use Gemini to extract email from the markdown or use Firecrawl's extract (if available)
            // Firecrawl also has an 'extract' feature but it requires a schema.

            return {
                url: officialUrl,
                website: officialUrl,
                // The markdown content will be in scrapeData.data.markdown
                // We'll return the markdown so the backgroundEnricher can pass it to Gemini
                markdown: scrapeData.data?.markdown
            } as any;

        } catch (error) {
            console.error("Firecrawl Error:", error);
            return null;
        }
    }
};
