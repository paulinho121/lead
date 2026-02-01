import { aiBridge } from './aiBridge';

export const parseUnstructuredText = async (text: string) => {
  try {
    return await aiBridge.callAiFunction('parseText', { text });
  } catch (error) {
    console.error("Gemini Proxy Parsing Error:", error);
    return [];
  }
};

export const discoverEmail = async (razaoSocial: string, cnpj: string) => {
  try {
    const res = await aiBridge.callAiFunction('discoverEmail', { razaoSocial, cnpj });
    return res.email || null;
  } catch (error) {
    return null;
  }
};

export const extractContactFromWeb = async (razaoSocial: string, webContent: string) => {
  try {
    // Note: This action could also be part of the proxy
    return await aiBridge.callAiFunction('parseText', { text: webContent });
  } catch (error) {
    console.error("Gemini Proxy Web Extraction Error:", error);
    return null;
  }
};

export const scoreLead = async (leadData: any) => {
  try {
    const res = await aiBridge.callAiFunction('scoreLead', { leadData });
    return res.score || 0;
  } catch (error) {
    console.error("Gemini Proxy Scoring Error:", error);
    return 5;
  }
};

export const generatePersonalizedScript = async (lead: any, template: string) => {
  try {
    const res = await aiBridge.callAiFunction('personalizeScript', { lead, template });
    return res.text || template;
  } catch (error) {
    console.error("Gemini Proxy Script Error:", error);
    return template;
  }
};
