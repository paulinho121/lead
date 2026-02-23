
export interface SerperResult {
    url: string;
    title: string;
    snippet: string;
}

export const serperService = {
    async search(query: string, limit: number = 1, customApiKey?: string): Promise<SerperResult[]> {
        const apiKey = customApiKey || import.meta.env.VITE_SERPER_API_KEY;
        if (!apiKey) {
            console.warn("Serper API Key missing.");
            return [];
        }

        try {
            const response = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: {
                    'X-API-KEY': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    q: query,
                    num: limit,
                    gl: 'br', // Brazil
                    hl: 'pt-br' // Portuguese
                })
            });

            if (!response.ok) {
                const error = await response.json();
                console.error("Serper API Error:", error);
                return [];
            }

            const data = await response.json();
            return (data.organic || []).map((item: any) => ({
                url: item.link,
                title: item.title,
                snippet: item.snippet
            }));
        } catch (error) {
            console.error("Serper Search Error:", error);
            return [];
        }
    }
};
