import { Lead } from '../types';
import { supabase } from './supabase';

export const leadService = {
    async getAllLeads(): Promise<Lead[]> {
        if (!supabase) return [];
        const { data, error } = await supabase
            .from('leads')
            .select('*')
            .order('captured_at', { ascending: false });

        if (error) {
            console.error('Error fetching leads:', error);
            return [];
        }

        return (data || []).map(leadService.mapFromDb);
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
            instagram: lead.instagram
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
            instagram: dbLead.instagram
        };
    }
};
