// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { action, ...payload } = await req.json()
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY not set in Edge Function secrets')
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        let result;

        switch (action) {
            case 'parseText':
                result = await handleParseText(model, payload.text);
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
            default:
                throw new Error('Unknown action: ' + action);
        }

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

async function handleParseText(model: any, text: string) {
    const prompt = `Extraia informações de empresas brasileiras (especialmente CNPJ, Email e Telefone) do seguinte texto. Retorne APENAS um array JSON. Texto: ${text.substring(0, 30000)}`;
    const res = await model.generateContent(prompt);
    const textResponse = res.response.text();
    // Basic cleanup to ensure only JSON is returned if the model adds markdown
    const jsonMatch = textResponse.match(/\[.*\]/s);
    return JSON.parse(jsonMatch ? jsonMatch[0] : textResponse);
}

async function handleDiscoverEmail(model: any, razaoSocial: string, cnpj: string) {
    const prompt = `Com base na Razão Social: "${razaoSocial}" e CNPJ: "${cnpj}", sugira o email corporativo mais provável. Retorne JSON: {"email": "..."}`;
    const res = await model.generateContent(prompt);
    return JSON.parse(res.response.text());
}

async function handleScoreLead(model: any, leadData: any) {
    const prompt = `Avalie o potencial de venda (0-10) desta empresa: ${JSON.stringify(leadData)}. Retorne JSON: {"score": number, "reason": "string"}`;
    const res = await model.generateContent(prompt);
    return JSON.parse(res.response.text());
}

async function handlePersonalizeScript(model: any, lead: any, template: string) {
    const prompt = `Personalize este template de email: "${template}" para este lead: ${JSON.stringify(lead)}. Retorne apenas o texto final.`;
    const res = await model.generateContent(prompt);
    return { text: res.response.text() };
}
