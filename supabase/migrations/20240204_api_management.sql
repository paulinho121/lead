
-- Tabela para armazenar chaves de API por Organização
CREATE TABLE IF NOT EXISTS organization_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- 'gemini', 'openai', 'deepseek', 'firecrawl'
    api_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, provider)
);

-- Habilitar RLS
ALTER TABLE organization_api_keys ENABLE ROW LEVEL SECURITY;

-- Regras de Segurança (Isolamento por Organização)
CREATE POLICY "Manage own organization API keys" ON organization_api_keys
FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Adicionar campo de preferência na tabela organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS preferred_ai_provider TEXT DEFAULT 'gemini';
