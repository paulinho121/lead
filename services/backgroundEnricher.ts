
import { Lead } from '../types';
import { fetchCNPJData } from './enrichmentService';
import { normalizeEmail, normalizePhone } from '../constants';
import { parseUnstructuredText, discoverEmail } from './geminiService';

export const backgroundEnricher = {
    async processLeads(
        leadsToProcess: Lead[],
        onUpdate: (lead: Lead) => void,
        onLog: (type: 'info' | 'error' | 'success', msg: string) => void
    ) {
        onLog('info', `Iniciando processamento em lote de ${leadsToProcess.length} leads...`);

        for (const lead of leadsToProcess) {
            if (lead.status === 'enriched') continue;

            try {
                onLog('info', `Consultando ${lead.cnpj}...`);
                const data = await fetchCNPJData(lead.cnpj);

                if (data) {
                    let email = data.email;

                    // IF API has NO email, try Gemini discovery as last resort
                    if (!email) {
                        onLog('info', `API sem email para ${data.razao_social}. Tentando IA...`);
                        email = await discoverEmail(data.razao_social, lead.cnpj);
                    }

                    const enrichedLead: Lead = {
                        ...lead,
                        razaoSocial: data.razao_social,
                        nomeFantasia: data.nome_fantasia,
                        email: email ? normalizeEmail(email) : undefined,
                        telefone: data.telefone ? normalizePhone(data.telefone) : undefined,
                        municipio: data.municipio,
                        uf: data.uf,
                        atividadePrincipal: data.cnae_fiscal_descricao,
                        situacaoCadastral: data.situacao_cadastral,
                        status: 'enriched'
                    };
                    onUpdate(enrichedLead);
                    onLog('success', `Sucesso (${email ? 'Com Email' : 'Sem Email'}): ${data.razao_social}`);
                } else {
                    // Keep as pending or mark as failed
                    onUpdate({ ...lead, status: 'failed', error: 'Dados não encontrados ou limite atingido' });
                    onLog('error', `Não encontrado ou limite atingido para: ${lead.cnpj}`);
                }
            } catch (err) {
                onUpdate({ ...lead, status: 'failed', error: 'Erro técnico na consulta' });
                onLog('error', `Erro técnico na consulta de ${lead.cnpj}`);
            }

            // DELAY: 3 seconds to be safer with fallback APIs
            for (let i = 3; i > 0; i--) {
                onLog('info', `Aguardando ${i}s para evitar bloqueio...`);
                await new Promise(r => setTimeout(r, 1000));
            }
        }
        onLog('success', 'Processamento de lote finalizado!');
    }
};
