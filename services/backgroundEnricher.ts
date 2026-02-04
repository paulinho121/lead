
import { Lead, Organization } from '../types';
import { fetchCNPJData } from './enrichmentService';
import { normalizeEmail, normalizePhone } from '../constants';
import { parseUnstructuredText, discoverEmail, extractContactFromWeb, scoreLead } from './geminiService';
import { firecrawlService } from './firecrawlService';

export const backgroundEnricher = {
    async processLeads(
        leadsToProcess: Lead[],
        onUpdate: (lead: Lead) => void,
        onLog: (type: 'info' | 'error' | 'success', msg: string) => void,
        org?: Organization
    ) {
        onLog('info', `Iniciando processamento em lote de ${leadsToProcess.length} leads...`);

        // Busca chaves customizadas da organização
        let customGeminiKey: string | undefined;
        if (org) {
            try {
                const keys = await (await import('./dbService')).leadService.getOrganizationApiKeys(org.id);
                // No processamento real, precisamos da chave original, não da mascarada. 
                // Nota: O método getOrganizationApiKeys atual mascara com ****. 
                // Precisamos de um método que pegue a chave real apenas para o backend de processamento.

                // Vamos buscar a chave real diretamente se for necessário
                const { data } = await (await import('./supabase')).supabase
                    .from('organization_api_keys')
                    .select('api_key')
                    .eq('organization_id', org.id)
                    .eq('provider', 'gemini')
                    .single();

                if (data?.api_key) {
                    customGeminiKey = data.api_key;
                    onLog('success', 'Usando chave Gemini customizada do cliente.');
                }
            } catch (e) {
                console.warn("Usando chave padrão da plataforma.");
            }
        }

        let count = 0;
        const total = leadsToProcess.length;

        for (const lead of leadsToProcess) {
            count++;
            if (lead.status === 'enriched' && lead.email) continue;

            try {
                onLog('info', `[${count}/${total}] Processando ${lead.cnpj}...`);
                const data = await fetchCNPJData(lead.cnpj);
                let scWebsite = '';

                if (data) {
                    let email = data.email;
                    let telefone = data.telefone;

                    // IF API has NO email, try Scraping + IA
                    if (!email) {
                        try {
                            onLog('info', `IA buscando site oficial para ${data.razao_social}...`);
                            const scrap = await firecrawlService.searchAndScrape(data.razao_social, lead.cnpj);

                            if (scrap?.website) {
                                onLog('success', `Site oficial mapeado: ${scrap.website}`);
                                scWebsite = scrap.website;

                                if ((scrap as any).markdown) {
                                    onLog('info', 'Extraindo contatos do conteúdo do site...');
                                    const extra = await extractContactFromWeb(data.razao_social, (scrap as any).markdown, customGeminiKey);
                                    if (extra?.email) {
                                        email = extra.email;
                                        onLog('success', `E-mail encontrado via Scraping: ${email}`);
                                    }
                                    if (extra?.telefone && !telefone) {
                                        telefone = extra.telefone;
                                        onLog('success', `Telefone extraído do site: ${telefone}`);
                                    }
                                }
                            }
                        } catch (scrapErr: any) {
                            const isLimit = scrapErr.message?.includes('402') || scrapErr.message?.includes('limit');
                            onLog('error', isLimit ? 'Limite do Minerador Web atingido. Usando dedução simples...' : `Erro no Minerador: ${scrapErr.message}`);
                        }

                        // Fallback to normal Gemini discovery if still no email
                        if (!email) {
                            onLog('info', `Gemini tentando dedução para ${data.razao_social}...`);
                            email = await discoverEmail(data.razao_social, lead.cnpj, customGeminiKey);
                        }
                    }

                    const isInactive = data.situacao_cadastral?.includes('BAIXADA') || data.situacao_cadastral?.includes('INAPTA');
                    const score = !isInactive ? await scoreLead(data, org, customGeminiKey) : 0;

                    const enrichedLead: Lead = {
                        ...lead,
                        razaoSocial: data.razao_social,
                        nomeFantasia: data.nome_fantasia,
                        email: email ? normalizeEmail(email) : undefined,
                        telefone: telefone ? normalizePhone(telefone) : undefined,
                        website: scWebsite || data.website,
                        municipio: data.municipio,
                        uf: data.uf,
                        atividadePrincipal: data.cnae_fiscal_descricao,
                        situacaoCadastral: data.situacao_cadastral,
                        status: isInactive ? 'failed' : 'enriched',
                        leadScore: score,
                        emailNotFound: !email,
                        error: isInactive ? `Empresa ${data.situacao_cadastral}` : undefined
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

                if (err.message?.includes('TERMINAL_AUTH_ERROR')) {
                    onLog('error', 'STOP: Erro de autenticação terminal detectado (Chave Inválida). Verifique suas configurações.');
                    break;
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
