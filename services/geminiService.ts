
import { GoogleGenerativeAI } from "@google/generative-ai";

import { Organization } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export const extractLeadsFromText = async (text: string) => {
  try {
    const prompt = `Você é um robô de prospecção B2B inteligente. Sua tarefa é extrair uma LISTA DE EMPRESAS (Razão Social ou Nome Fantasia) do texto bruto fornecido.
           
           Instruções Críticas:
           1. O texto pode ser uma lista de associados, um catálogo ou apenas nomes soltos de empresas.
           2. Identifique o Nome da Empresa e o Website/URL (se houver).
           3. Retorne APENAS um array JSON: [{"razaoSocial": "...", "website": "..."}].
           4. Se não encontrar nada que pareça uma empresa, retorne [].
           
           Texto: ${text.substring(0, 30000)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return safeJsonParse(response.text()) || [];
  } catch (error) {
    console.error("Gemini Direct Error:", error);
    return [];
  }
};

export const identifyNicheFromContent = async (text: string) => {
  try {
    const prompt = `Você é um especialista em segmentação de mercado. Analise o seguinte conteúdo de perfil: "${text.substring(0, 5000)}".
        
        Tarefa:
        1. Identifique o NICHO comercial (Ex: "Energia Solar", "Arquitetura de Interiores", "Venda de Equipamentos Cinematográficos").
        2. Identifique a LOCALIDADE principal (Cidade/Estado) se houver.
        
        IMPORTANTE: O nicho deve ser uma frase curta que sirva como termo de pesquisa no Google.
        
        Retorne APENAS um JSON: {"niche": "...", "location": "..."}.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return safeJsonParse(response.text());
  } catch (error) {
    console.error("Gemini Niche ID Error:", error);
    return null;
  }
};

export const discoverEmail = async (razaoSocial: string, cnpj: string) => {
  try {
    const prompt = `Com base na Razão Social: "${razaoSocial}" e CNPJ: "${cnpj}", sugira o email corporativo mais provável. 
        Retorne APENAS um JSON: {"email": "..."}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const parsed = safeJsonParse(response.text());
    return parsed?.email || null;
  } catch (error) {
    console.error("Gemini discoverEmail Error:", error);
    return null;
  }
};

export const extractContactFromWeb = async (razaoSocial: string, text: string) => {
  try {
    const prompt = `Extraia o e-mail e telefone da empresa "${razaoSocial}" do seguinte texto bruto:
        
        Texto: ${text.substring(0, 30000)}
        
        Retorne APENAS um JSON: {"email": "...", "telefone": "..."}. Se não encontrar, deixe em branco.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return safeJsonParse(response.text());
  } catch (error) {
    console.error("Gemini extractContactFromWeb Error:", error);
    return null;
  }
};

export const scoreLead = async (leadData: any, org?: Organization) => {
  try {
    const nicheContext = org ? `para o nicho de ${org.niche}` : "com base em atividade comercial e localidade";
    const prompt = `Avalie o potencial de venda (0-10) desta empresa brasileira ${nicheContext}: ${JSON.stringify(leadData)}. 
        Considere a relevância para o negócio descrito: ${org?.description || "Prospecção B2B Geral"}.
        Retorne APENAS um JSON: {"score": number, "reason": "string"}`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const parsed = safeJsonParse(response.text());
    return parsed?.score || 0;
  } catch (error) {
    console.error("Gemini scoreLead Error:", error);
    return 0;
  }
};

export const parseUnstructuredText = async (text: string) => {
  try {
    const prompt = `Extraia informações de empresas brasileiras (especialmente CNPJ, Nome, Email e Telefone) do seguinte texto. 
        Retorne APENAS um array JSON: [{"cnpj": "...", "razaoSocial": "...", "email": "...", "telefone": "..."}].
        Se não encontrar, retorne [].
        
        Texto: ${text.substring(0, 30000)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return safeJsonParse(response.text()) || [];
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return [];
  }
};

export const generatePersonalizedScript = async (lead: any, template: string, org?: Organization) => {
  try {
    const context = org
      ? `Você é um consultor especialista em ${org.niche}. 
         Trabalhamos com: ${org.brands || "soluções B2B"}. 
         Nosso tom é: ${org.toneOfVoice || "Profissional"}. 
         Objetivo: ${org.goal || "Gerar curiosidade e parceria"}.`
      : `Você é um consultor especialista em prospecção B2B. Nosso tom é profissional e focado em gerar curiosidade.`;

    const prompt = `${context}
        Personalize este template de mensagem: "${template}" para este lead: ${JSON.stringify(lead)}.
        Retorne APENAS o texto final da mensagem, formatado para envio.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini personalizeScript Error:", error);
    return template;
  }
};

export const personalizeScript = generatePersonalizedScript;
