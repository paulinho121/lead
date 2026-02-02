import { EnrichmentData } from '../types';
import { aiBridge } from './aiBridge';

/**
 * Consults the AI Bridge (Edge Function) for company data.
 * This avoids CORS issues that happen when calling BrasilAPI/ReceitaWS from the frontend.
 */
export const fetchCNPJData = async (cnpj: string): Promise<EnrichmentData | null> => {
  try {
    const data = await aiBridge.callAiFunction('fetchCompanyData', { cnpj });
    return data as EnrichmentData | null;
  } catch (error) {
    console.warn(`Failed to enrich CNPJ ${cnpj} via Bridge:`, error);
    return null;
  }
};
