
export interface Lead {
  id: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  atividadePrincipal?: string;
  situacaoCadastral?: string;
  municipio?: string;
  uf?: string;
  email?: string;
  telefone?: string;
  website?: string;
  status: 'pending' | 'processing' | 'enriched' | 'failed';
  error?: string;
  source: string;
  capturedAt: string;
  instagram?: string;
  userId?: string;
  // CRM fields
  contacted?: boolean;
  contactResponse?: string;
  observations?: string;
  niche?: string;
  facebook?: string;
  emailNotFound?: boolean;
  lastUpdated?: string;
  stage?: 'lead' | 'contacted' | 'presentation' | 'negotiation' | 'closed_won' | 'closed_lost' | 'disqualified';
  leadScore?: number;
  nextContactDate?: string;
  lostReason?: string;
  organizationId?: string;
}

export interface Organization {
  id: string;
  name: string;
  niche: string; // Ex: Energia Solar, Fotografia, etc.
  description: string;
  toneOfVoice: string; // Ex: Profissional, Amigável, Técnico
  brands?: string; // Marcas representadas
  goal?: string; // Objetivo comercial
  website?: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  fullname: string;
  avatar_url?: string;
  last_seen_at?: string;
  online_status?: boolean;
  role?: 'admin' | 'vendedor';
  target_leads?: number;
  theme?: string;
  organization_id?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export interface EnrichmentData {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
  website?: string;
  municipio: string;
  uf: string;
  cnae_fiscal_descricao: string;
  situacao_cadastral: string;
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  LEADS = 'leads',
  ENRICH = 'enrich',
  CRM = 'crm',
  STRATEGY = 'strategy',
  MURAL = 'mural',
  ADMIN = 'admin',
  REUNIAO = 'reuniao',
  CAPTURE = 'capture',
  SETTINGS = 'settings'
}
