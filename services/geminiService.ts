
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
