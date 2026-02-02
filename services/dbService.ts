import { Lead } from '../types';
import { supabase } from './supabase';

export const leadService = {
    async getAllLeads(userId?: string, page: number = 0, pageSize: number = 50): Promise<Lead[]> {
        if (!supabase) return [];
        let query = supabase
            .from('leads')
            .select('*')
            .order('captured_at', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching leads:', error);
            return [];
        }

        return (data || []).map(leadService.mapFromDb);
    },

    async getStats(): Promise<{ total: number, enriched: number, pending: number, failed: number, hasContact: number, unassigned: number }> {
        if (!supabase) return { total: 0, enriched: 0, pending: 0, failed: 0, hasContact: 0, unassigned: 0 };

        try {
            const [
                { count: total },
                { count: enriched },
                { count: pending },
                { count: failed },
                { count: hasContact },
                { count: unassigned }
            ] = await Promise.all([
                supabase.from('leads').select('*', { count: 'exact', head: true }),
                supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'enriched'),
                supabase.from('leads').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing']),
                supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
                supabase.from('leads').select('*', { count: 'exact', head: true }).or('email.neq."",telefone.neq.""').not('email', 'is', null),
                supabase.from('leads').select('*', { count: 'exact', head: true }).is('user_id', null)
            ]);

            return {
                total: total || 0,
                enriched: enriched || 0,
                pending: pending || 0,
                failed: failed || 0,
                hasContact: hasContact || 0,
                unassigned: unassigned || 0
            };
        } catch (error) {
            console.error('Error fetching global stats:', error);
            return { total: 0, enriched: 0, pending: 0, failed: 0, hasContact: 0, unassigned: 0 };
        }
    },

    async getDashboardData(): Promise<{ stateStats: any[], salespersonStats: any[] }> {
        if (!supabase) return { stateStats: [], salespersonStats: [] };

        // For charts, we fetch a significant sample (e.g., 2000 leads) to get meaningful distributions
        // In a real production app, this would be an RPC or an Edge Function returning pre-aggregated data
        const { data, error } = await supabase
            .from('leads')
            .select('uf, user_id, contacted, email')
            .limit(5000);

        if (error) return { stateStats: [], salespersonStats: [] };

        const stateStats = data.reduce((acc: any[], lead) => {
            if (!lead.uf) return acc;
            const existing = acc.find(a => a.name === lead.uf);
            if (existing) existing.value += 1;
            else acc.push({ name: lead.uf, value: 1 });
            return acc;
        }, []).sort((a, b) => b.value - a.value).slice(0, 5);

        return { stateStats, salespersonStats: data }; // We'll return the raw data for salesperson processing for now
    },

    async getAdminLeads(page: number = 0, pageSize: number = 50): Promise<Lead[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('captured_at', { ascending: false })
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
            console.error('Error fetching admin leads:', error);
            return [];
        }
        return (data || []).map(leadService.mapFromDb);
    },

    async getAllProfiles(): Promise<any[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('profiles')
            .select('*');
        if (error) return [];
        return data || [];
    },

    async getAvailableStates(): Promise<string[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('leads')
            .select('uf')
            .is('user_id', null)
            .not('uf', 'is', null)
            .neq('uf', '')
            .limit(1000);

        if (error) {
            console.error('Error fetching available states:', error);
            return [];
        }
        const states = Array.from(new Set(data.map(item => item.uf).filter(Boolean))).sort();
        return states;
    },

    async syncProfile(userId: string, email: string, fullname?: string): Promise<void> {
        if (!supabase) return;
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                email: email,
                fullname: fullname || email.split('@')[0],
                online_status: true,
                last_seen_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        if (error) console.error('Error syncing profile:', error);
    },

    async updateProfileTheme(userId: string, theme: string): Promise<void> {
        if (!supabase) return;
        const { error } = await supabase
            .from('profiles')
            .update({ theme, updated_at: new Date().toISOString() })
            .eq('id', userId);
        if (error) throw error;
    },

    async updateHeartbeat(userId: string): Promise<void> {
        if (!supabase) return;
        await supabase
            .from('profiles')
            .update({
                last_seen_at: new Date().toISOString(),
                online_status: true
            })
            .eq('id', userId);
    },

    async setOffline(userId: string): Promise<void> {
        if (!supabase) return;
        await supabase
            .from('profiles')
            .update({ online_status: false })
            .eq('id', userId);
    },

    async getMessages(userId: string, targetId: string): Promise<any[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${userId},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${userId})`)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }
        return data || [];
    },

    async sendMessage(senderId: string, receiverId: string, content: string): Promise<void> {
        if (!supabase) return;
        const { error } = await supabase
            .from('messages')
            .insert({
                sender_id: senderId,
                receiver_id: receiverId,
                content
            });
        if (error) throw error;
    },

    async requestNewLeads(vendedorId: string, uf?: string): Promise<void> {
        if (!supabase) return;
        const { error } = await supabase.rpc('solicitar_novos_leads', {
            vendedor_id: vendedorId,
            p_uf: uf || null
        });
        if (error) {
            console.error('Error requesting leads:', error);
            throw error;
        }
    },

    async upsertLeads(leads: Lead[]): Promise<void> {
        if (!supabase) return;
        const dbLeads = leads.map(leadService.mapToDb);
        const { error } = await supabase
            .from('leads')
            .upsert(dbLeads, { onConflict: 'cnpj' });

        if (error) {
            console.error('Error upserting leads:', error);
            throw error;
        }
    },

    async deleteLead(id: string): Promise<void> {
        if (!supabase) return;
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting lead:', error);
            throw error;
        }
    },

    async getGlobalRanking(): Promise<any[]> {
        if (!supabase) return [];
        // Busca todos os leads atribuídos que foram contatados
        const { data, error } = await supabase
            .from('leads')
            .select('user_id, contacted, email')
            .not('user_id', 'is', null);

        if (error) {
            console.error('Error fetching ranking data:', error);
            return [];
        }

        return data;
    },

    async getContactedLeads(): Promise<Lead[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .eq('contacted', true)
            .order('captured_at', { ascending: false })
            .limit(1000);

        if (error) {
            console.error('Error fetching contacted leads:', error);
            return [];
        }
        return (data || []).map(leadService.mapFromDb);
    },

    async clearAllLeads(): Promise<void> {
        if (!supabase) return;
        const { error } = await supabase
            .from('leads')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete everything

        if (error) {
            console.error('Error clearing leads:', error);
            throw error;
        }
    },

    async releaseAdminLeads(adminId: string): Promise<number> {
        if (!supabase) return 0;
        const { data, error } = await supabase
            .from('leads')
            .update({ user_id: null })
            .eq('user_id', adminId)
            .select('*');

        if (error) {
            console.error('Error releasing leads:', error);
            throw error;
        }
        return data?.length || 0;
    },

    async recycleLeads(days: number): Promise<number> {
        if (!supabase) return 0;

        // Calcular data de corte
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const cutoffIso = cutoff.toISOString();

        // Buscar leads estagnados (atribuídos, não contatados e não atualizados há X dias)
        const { data, error } = await supabase
            .from('leads')
            .update({
                user_id: null,
                observations: 'Lead reciclado automaticamente por inatividade.'
            })
            .not('user_id', 'is', null)
            .eq('contacted', false)
            .lt('updated_at', cutoffIso)
            .select();

        if (error) {
            console.error('Error recycling leads:', error);
            throw error;
        }

        return data?.length || 0;
    },

    mapToDb(lead: Lead) {
        return {
            id: lead.id,
            cnpj: lead.cnpj.replace(/[^\d]/g, ''),
            razao_social: lead.razaoSocial,
            nome_fantasia: lead.nomeFantasia,
            atividade_principal: lead.atividadePrincipal,
            municipio: lead.municipio,
            uf: lead.uf,
            email: lead.email,
            telefone: lead.telefone,
            status: lead.status,
            error: lead.error,
            source: lead.source,
            captured_at: lead.capturedAt,
            contacted: lead.contacted,
            contact_response: lead.contactResponse,
            observations: lead.observations,
            situacao_cadastral: lead.situacaoCadastral,
            instagram: lead.instagram,
            user_id: lead.userId,
            niche: lead.niche,
            website: lead.website,
            facebook: lead.facebook,
            email_not_found: lead.emailNotFound,
            updated_at: new Date().toISOString(),
            stage: lead.stage,
            lead_score: lead.leadScore,
            next_contact_date: lead.nextContactDate,
            lost_reason: lead.lostReason
        };
    },

    mapFromDb(dbLead: any): Lead {
        return {
            id: dbLead.id,
            cnpj: dbLead.cnpj,
            razaoSocial: dbLead.razao_social,
            nomeFantasia: dbLead.nome_fantasia,
            atividadePrincipal: dbLead.atividade_principal,
            municipio: dbLead.municipio,
            uf: dbLead.uf,
            email: dbLead.email,
            telefone: dbLead.telefone,
            status: dbLead.status,
            error: dbLead.error,
            source: dbLead.source,
            capturedAt: dbLead.captured_at,
            contacted: dbLead.contacted,
            contactResponse: dbLead.contact_response,
            observations: dbLead.observations,
            situacaoCadastral: dbLead.situacao_cadastral,
            instagram: dbLead.instagram,
            userId: dbLead.user_id,
            niche: dbLead.niche,
            website: dbLead.website,
            facebook: dbLead.facebook,
            emailNotFound: dbLead.email_not_found,
            lastUpdated: dbLead.updated_at,
            stage: dbLead.stage,
            leadScore: dbLead.lead_score,
            nextContactDate: dbLead.next_contact_date,
            lostReason: dbLead.lost_reason
        };
    }
};
