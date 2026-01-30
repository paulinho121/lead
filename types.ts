
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
}

export interface EnrichmentData {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  email: string;
  telefone: string;
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
  ADMIN = 'admin'
}
