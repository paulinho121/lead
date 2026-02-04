// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function safeJsonParse(text: string) {
    try {
        // Try direct parse first
        return JSON.parse(text);
    } catch {
        // Try to extract JSON from markdown or text
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch {
                throw new Error("Failed to parse extracted JSON: " + text.substring(0, 100));
            }
        }
        throw new Error("No JSON found in AI response: " + text.substring(0, 100));
    }
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders, status: 200 })
    }

    try {
        const body = await req.json();
        const { action, ...payload } = body;
        const apiKey = Deno.env.get('GEMINI_API_KEY');

        console.log(`[Proxy] Action: ${action}`);

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not set in Edge Function secrets');
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let result;

        switch (action) {
            case 'parseText':
                result = await handleParseText(model, payload.text, payload.mode);
                break;
            case 'discoverEmail':
                result = await handleDiscoverEmail(model, payload.razaoSocial, payload.cnpj);
                break;
            case 'scoreLead':
                result = await handleScoreLead(model, payload.leadData);
                break;
            case 'personalizeScript':
                result = await handlePersonalizeScript(model, payload.lead, payload.template);
                break;
            case 'fetchCompanyData':
                result = await handleFetchCompanyData(payload.cnpj);
                break;
            case 'scrapeUrl':
                result = await handleScrapeUrl(payload.url);
                break;
            case 'identifyNiche':
                result = await handleIdentifyNiche(model, payload.text);
                break;
            default:
                throw new Error('Unknown action: ' + action);
        }

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error(`[Proxy Error]`, error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

async function handleParseText(model: any, text: string, mode?: string) {
    const isDiscovery = mode === 'discovery';
    const prompt = isDiscovery
        ? `Você é um robô de prospecção B2B inteligente. Sua tarefa é extrair uma LISTA DE EMPRESAS (Razão Social ou Nome Fantasia) do texto bruto fornecido.
           
           Instruções Críticas:
           1. O texto pode ser uma lista de associados, um catálogo ou apenas nomes soltos de empresas.
           2. Identifique o Nome da Empresa e o Website/URL (se houver).
           3. Se o texto contiver apenas um ou dois nomes, extraia-os como empresas.
           4. Ignore termos comuns de navegação (Home, Contato, etc).
           5. Retorne APENAS um array JSON: [{"razaoSocial": "...", "website": "..."}].
           6. Se não encontrar nada que pareça uma empresa, retorne [].
           
           Texto: ${text.substring(0, 30000)}`
        : `Extraia informações de empresas brasileiras (especialmente CNPJ, Email e Telefone) do seguinte texto. Retorne APENAS um array JSON. Texto: ${text.substring(0, 30000)}`;

    const res = await model.generateContent(prompt);
    return safeJsonParse(res.response.text());
}

async function handleScrapeUrl(url: string) {
    const jinaKey = Deno.env.get('JINA_API_KEY');

    // Ensure URL is absolute for Jina
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;

    if (jinaKey) {
        try {
            console.log(`[Proxy] Trying Jina for: ${targetUrl}`);
            const response = await fetch(`https://r.jina.ai/${targetUrl}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${jinaKey}`,
                    'Accept': 'text/plain',
                    'X-With-Generated-Alt': 'true' // Helpful for images
                }
            });
            if (response.ok) {
                const text = await response.text();
                if (text && text.length > 200) { // Ensure we actually got content
                    return { markdown: text };
                }
            }
        } catch (e) {
            console.error("Jina Scrape Error in Proxy:", e);
        }
    }

    // Fallback to Firecrawl
    const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlKey) throw new Error('Neither JINA balance nor FIRECRAWL key found');

    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${firecrawlKey}`
        },
        body: JSON.stringify({
            url,
            formats: ['markdown'],
            onlyMainContent: false,
            waitFor: 3000
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Scrape Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    return { markdown: data.data?.markdown || "" };
}


async function handleDiscoverEmail(model: any, razaoSocial: string, cnpj: string) {
    const prompt = `Com base na Razão Social: "${razaoSocial}" e CNPJ: "${cnpj}", sugira o email corporativo mais provável. Retorne JSON: {"email": "..."}`;
    const res = await model.generateContent(prompt);
    return safeJsonParse(res.response.text());
}

async function handleScoreLead(model: any, leadData: any) {
    const prompt = `Avalie o potencial de venda (0-10) desta empresa: ${JSON.stringify(leadData)}. Retorne JSON: {"score": number, "reason": "string"}`;
    const res = await model.generateContent(prompt);
    return safeJsonParse(res.response.text());
}

async function handlePersonalizeScript(model: any, lead: any, template: string) {
    const prompt = `Você é um consultor especialista em equipamentos de iluminação e ótica cinematográfica. 
    Personalize este template de email: "${template}" para este lead: ${JSON.stringify(lead)}.
    Considere que somos representantes oficiais das marcas: Aputure, DZO, Caligre, Astera e Cream Source.
    O tom deve ser profissional, direto e focado em gerar curiosidade técnica ou parceria produtiva.
    Retorne APENAS o texto final do e-mail ou mensagem, sem explicações extras.`;
    const res = await model.generateContent(prompt);
    return { text: res.response.text() };
}

async function handleFetchCompanyData(cnpj: string) {
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    let result = null;

    try {
        // 1. Try BrasilAPI
        const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
        if (response.ok) {
            const data = await response.json();
            result = {
                razao_social: data.razao_social || data.nome_fantasia || 'Empresa Encontrada',
                nome_fantasia: data.nome_fantasia || '',
                cnpj: data.cnpj || cleanCNPJ,
                email: data.email || '',
                telefone: data.ddd_telefone_1 || data.telefone || '',
                municipio: data.municipio || '',
                uf: data.uf || '',
                website: data.website || '',
                cnae_fiscal_descricao: data.cnae_fiscal_descricao || 'N/A',
                situacao_cadastral: data.descricao_situacao_cadastral || 'ATIVA'
            };
        }

        // 2. Fallback: ReceitaWS
        if (!result || !result.email) {
            try {
                const respWS = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCNPJ}`);
                if (respWS.ok) {
                    const dataWS = await respWS.json();
                    if (dataWS.status !== 'ERROR') {
                        if (!result) {
                            result = {
                                razao_social: dataWS.nome || '',
                                nome_fantasia: dataWS.fantasia || '',
                                cnpj: cleanCNPJ,
                                email: dataWS.email || '',
                                telefone: dataWS.telefone || '',
                                municipio: dataWS.municipio || '',
                                uf: dataWS.uf || '',
                                website: '',
                                cnae_fiscal_descricao: dataWS.atividade_principal?.[0]?.text || '',
                                situacao_cadastral: dataWS.situacao || 'ATIVA'
                            };
                        } else {
                            result.email = dataWS.email || result.email;
                            result.telefone = dataWS.telefone || result.telefone;
                        }
                    }
                }
            } catch (e) { /* ignore */ }
        }

        // 3. Fallback: CNPJ.ws
        if (!result || !result.email) {
            try {
                const respWS = await fetch(`https://publica.cnpj.ws/api/cnpj/v1/${cleanCNPJ}`);
                if (respWS.ok) {
                    const dataWS = await respWS.json();
                    if (!result) {
                        result = {
                            razao_social: dataWS.razao_social || '',
                            nome_fantasia: dataWS.estabelecimento?.nome_fantasia || '',
                            cnpj: cleanCNPJ,
                            email: dataWS.estabelecimento?.email || '',
                            telefone: dataWS.estabelecimento?.telefone1 || '',
                            municipio: dataWS.estabelecimento?.cidade?.nome || '',
                            uf: dataWS.estabelecimento?.estado?.sigla || '',
                            website: '',
                            cnae_fiscal_descricao: dataWS.estabelecimento?.atividade_principal?.descricao || '',
                            situacao_cadastral: dataWS.estabelecimento?.situacao_cadastral || 'ATIVA'
                        };
                    } else {
                        result.email = dataWS.estabelecimento?.email || result.email;
                        result.telefone = dataWS.estabelecimento?.telefone1 || result.telefone;
                    }
                }
            } catch (e) { /* ignore */ }
        }

        return result;
    } catch (error) {
        console.error("Error in handleFetchCompanyData:", error);
        return null;
    }
}

async function handleIdentifyNiche(model: any, text: string) {
    const prompt = `Você é um especialista em segmentação de mercado. Analise o seguinte conteúdo de perfil: "${text.substring(0, 5000)}".
    
    Tarefa:
    1. Identifique o NICHO comercial (Ex: "Energia Solar", "Arquitetura de Interiores", "Venda de Equipamentos Cinematográficos").
    2. Identifique a LOCALIDADE principal (Cidade/Estado) se houver.
    
    IMPORTANTE: O nicho deve ser uma frase curta que sirva como termo de pesquisa no Google.
    
    Retorne APENAS um JSON: {"niche": "...", "location": "..."}.`;

    const res = await model.generateContent(prompt);
    return safeJsonParse(res.response.text());
}
