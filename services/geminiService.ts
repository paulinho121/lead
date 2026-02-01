
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const parseUnstructuredText = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Extraia informações de empresas brasileiras (especialmente CNPJ, Email e Telefone) do seguinte texto extraído de um PDF. 
      Muitas vezes o email e o telefone estão próximos ao CNPJ ou no cabeçalho/rodapé.
      Retorne APENAS o JSON conforme o schema.
      Texto: ${text.substring(0, 50000)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              cnpj: { type: Type.STRING },
              razaoSocial: { type: Type.STRING },
              email: { type: Type.STRING },
              telefone: { type: Type.STRING },
              municipio: { type: Type.STRING },
              uf: { type: Type.STRING }
            },
            required: ["cnpj"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return [];
  }
};

export const discoverEmail = async (razaoSocial: string, cnpj: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Você é um especialista em prospecção B2B. 
      Com base na Razão Social: "${razaoSocial}" e CNPJ: "${cnpj}", 
      tente identificar ou sugerir o email de contato CORPORATIVO mais provável (ex: contato@empresa.com.br ou comercial@...).
      IMPORTANTE: Se o email da Receita parecer ser de uma contabilidade (ex: @contabil.com), tente encontrar o domínio real da empresa.
      Retorne APENAS um JSON com o campo "email" contendo o endereço ou null se for impossível deduzir.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            email: { type: Type.STRING }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed.email || null;
  } catch (error) {
    return null;
  }
};

export const extractContactFromWeb = async (razaoSocial: string, webContent: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Analise o conteúdo do site oficial da empresa "${razaoSocial}" e extraia o e-mail de contato e o e-mail comercial. 
      Conteúdo do site:
      ${webContent.substring(0, 30000)}
      Retorne APENAS um JSON com os campos "email" e "telefone" (se encontrados).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            email: { type: Type.STRING },
            telefone: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Web Extraction Error:", error);
    return null;
  }
};

export const scoreLead = async (leadData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Analise os dados desta empresa e dê uma pontuação de 0 a 10 para o potencial de prospecção B2B (MCI LeadPro).
      Regras: empresas ativas e com atividades comerciais claras ganham mais pontos.
      Dados: ${JSON.stringify(leadData)}
      Retorne APENAS um JSON com o campo "score" (número) e "reason" (string curta).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            reason: { type: Type.STRING }
          },
          required: ["score"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed.score || 0;
  } catch (error) {
    console.error("Gemini Scoring Error:", error);
    return 5; // Default score
  }
};

export const generatePersonalizedScript = async (lead: any, template: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Você é um mentor de vendas B2B de elite. 
      Sua tarefa é personalizar um template de e-mail/mensagem para um lead específico.
      
      TEMPLATE BASE:
      "${template}"

      DADOS DO LEAD:
      Razão Social: ${lead.razaoSocial}
      Setor/Atividade: ${lead.atividadePrincipal}
      Local: ${lead.municipio} - ${lead.uf}
      Nome Fantasia: ${lead.nomeFantasia}

      REGRAS:
      1. Substitua as variáveis {razao_social}, {municipio}, {uf} etc por dados reais.
      2. Adicione uma frase PERSONALIZADA no início sobre o setor da empresa (${lead.atividadePrincipal}) para mostrar que não é um spam.
      3. Mantenha o tom profissional mas humano.
      4. Retorne APENAS o texto final do corpo da mensagem.`,
    });

    return response.text || template;
  } catch (error) {
    console.error("Gemini Script Personalization Error:", error);
    return template;
  }
};

