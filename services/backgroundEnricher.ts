
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

        let count = 0;
        const total = leadsToProcess.length;

        for (const lead of leadsToProcess) {
            count++;
            if (lead.status === 'enriched' && lead.email) continue;

            try {
                onLog('info', `[${count}/${total}] Processando ${lead.cnpj}...`);
                const data = await fetchCNPJData(lead.cnpj);

                if (data) {
                    let email = data.email;

                    // IF API has NO email, try Gemini discovery
                    if (!email) {
                        onLog('info', `IA buscando email para ${data.razao_social}...`);
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
                    onLog('success', `Sucesso em ${count}/${total}: ${data.razao_social}`);
                } else {
                    onUpdate({ ...lead, status: 'failed', error: 'Não encontrado' });
                    onLog('error', `Não encontrado (${count}/${total}): ${lead.cnpj}`);
                }
            } catch (err: any) {
                const isRateLimit = err.message?.includes('429') || err.message?.includes('limite');
                onUpdate({ ...lead, status: 'failed', error: isRateLimit ? 'Limite atingido' : 'Erro técnico' });
                onLog('error', `Erro em ${lead.cnpj}: ${err.message || 'Erro desconhecido'}`);

                if (isRateLimit) {
                    onLog('info', 'Limite de taxa atingido. Aguardando 60s...');
                    await new Promise(r => setTimeout(r, 60000));
                }
            }

            // DELAY: 3 seconds (reduzido ligeiramente para 2s se sucesso, 3s se erro)
            const delay = 3000;
            const steps = 3;
            for (let i = steps; i > 0; i--) {
                if (total > 1) { // Só loga contagem se for lote
                    onLog('info', `Próximo lead em ${i}s...`);
                }
                await new Promise(r => setTimeout(r, 1000));
            }
        }
        onLog('success', 'Processamento de lote finalizado!');
    }
};
