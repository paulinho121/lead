
import { EnrichmentData } from '../types';

/**
 * Consults BrasilAPI (primary) or ReceitaWS (fallback) for company data.
 */
export const fetchCNPJData = async (cnpj: string): Promise<EnrichmentData | null> => {
  const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
  let result: EnrichmentData | null = null;

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

    // 2. If we found nothing OR found it but it's missing the email, try ReceitaWS
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
              // Update only missing fields
              result.email = dataWS.email || result.email;
              result.telefone = dataWS.telefone || result.telefone;
              result.situacao_cadastral = dataWS.situacao || result.situacao_cadastral;
            }
          }
        }
      } catch (e) {
        console.warn("ReceitaWS Fallback fail");
      }
    }

    // 3. Third Fallback: CNPJ.ws (Public API) - Often has more recent emails
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
      } catch (e) {
        console.warn("CNPJ.ws Fallback fail");
      }
    }

    return result;
  } catch (error) {
    console.warn(`Failed to enrich CNPJ ${cnpj}:`, error);
    return null;
  }
};
