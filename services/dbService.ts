import { Lead } from '../types';
import { supabase } from './supabase';

export const leadService = {
    async getAllLeads(userId?: string): Promise<Lead[]> {
        if (!supabase) return [];
        let query = supabase
            .from('leads')
            .select('*')
            .order('captured_at', { ascending: false })
            .limit(20000);

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

    async getStats(): Promise<{ total: number, enriched: number, pending: number, failed: number, hasContact: number }> {
        if (!supabase) return { total: 0, enriched: 0, pending: 0, failed: 0, hasContact: 0 };

        const { count: total, error: e1 } = await supabase.from('leads').select('*', { count: 'exact', head: true });
        const { count: enriched, error: e2 } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'enriched');
        const { count: pending, error: e3 } = await supabase.from('leads').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing']);
        const { count: failed, error: e4 } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'failed');

        // Count leads that have email OR phone
        const { count: withEmail, error: e5 } = await supabase.from('leads').select('*', { count: 'exact', head: true }).not('email', 'is', null);

        if (e1 || e2 || e3 || e4 || e5) {
            console.error('Error fetching stats');
        }

        return {
            total: total || 0,
            enriched: enriched || 0,
            pending: pending || 0,
            failed: failed || 0,
            hasContact: withEmail || 0 // Simplificação: priorizando email para o dashboard
        };
    },

    async getAdminLeads(): Promise<Lead[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .limit(20000);

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
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (error) {
            console.error('Error syncing profile:', error);
        }
    },

    async requestNewLeads(vendedorId: string, uf?: string): Promise<void> {
        if (!supabase) return;
        const { error } = await supabase.rpc('solicitar_novos_leads', {
            p_vendedor_id: vendedorId,
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
            website: lead.website
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
            website: dbLead.website
        };
    }
};
