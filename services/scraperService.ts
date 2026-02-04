
/**
 * Scraper Service - Solução Open Source e Local
 * Focada em reduzir custos com APIs pagas.
 */
export const scraperService = {
    /**
     * Tenta buscar empresas via DuckDuckGo HTML (Gratuito e sem API Key)
     * Como o DuckDuckGo HTML não tem CORS restritivo como o Google, 
     * ele é uma ótima "terceira via" de dados.
     */
    async freeSearch(query: string): Promise<any[]> {
        try {
            console.log(`[Scraper] Iniciando busca gratuita para: ${query}`);

            // Usamos a versão HTML básica do DuckDuckGo que é fácil de parsear
            const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' empresas brasil')}`;

            // Nota: Em navegadores, isso pode sofrer bloqueio de CORS.
            // Se falhar, o sistema ainda tem o Jina e Firecrawl como backup.
            const response = await fetch(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (!response.ok) {
                console.warn(`[Scraper] DuckDuckGo retornou status: ${response.status}`);
                return [];
            }

            const html = await response.text();

            // Extração simples de links e títulos via Regex 
            const results: any[] = [];
            const resultRegex = /<a class="result__a" href="([^"]+)">([^<]+)<\/a>/g;
            let match;

            while ((match = resultRegex.exec(html)) !== null && results.length < 15) {
                const url = new URL(match[1]);
                // DuckDuckGo encapsula URLs externas, vamos extrair a URL real se necessário
                const realUrl = url.searchParams.get('uddg') || match[1];

                results.push({
                    url: realUrl,
                    razaoSocial: match[2].trim(),
                    source: 'Free Search (DuckDuckGo)'
                });
            }

            console.log(`[Scraper] ${results.length} resultados encontrados via busca gratuita.`);
            return results;
        } catch (error) {
            console.error("[Scraper] Erro na busca gratuita:", error);
            return [];
        }
    },

    /**
     * Tenta extrair conteúdo básico de uma página sem API paga
     * (Funciona melhor para sites que permitem CORS ou via Proxy)
     */
    async simpleScrape(url: string): Promise<string | null> {
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const text = await response.text();

            // Limpeza básica: remove scripts e styles para economizar tokens da IA
            return text
                .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, "")
                .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, "")
                .replace(/<[^>]+>/g, " ") // Remove tags HTML
                .replace(/\s+/g, " ")     // Remove espaços extras
                .substring(0, 10000);     // Limita tamanho
        } catch {
            return null;
        }
    }
};
