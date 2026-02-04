
export const jinaService = {
    async scrapeUrl(url: string): Promise<string | null> {
        const apiKey = import.meta.env.VITE_JINA_API_KEY;
        if (!apiKey) {
            console.warn("Jina AI API Key missing");
            return null;
        }

        try {
            const response = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'text/plain'
                }
            });

            if (!response.ok) {
                console.error("Jina Error:", response.status);
                return null;
            }

            return await response.text();
        } catch (error) {
            console.error("Jina Scrape Error:", error);
            return null;
        }
    }
};
