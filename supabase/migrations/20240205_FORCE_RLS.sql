
-- SOLUÇÃO DE ENGENHARIA SENIOR: ISOLAMENTO TOTAL (RLS NUCLEAR)
-- Este script corrige o vazamento de dados entre organizações e entre usuários.

BEGIN;

-- 1. GARANTIR QUE RLS ESTÁ ATIVADO (Onde o erro costuma estar)
ALTER TABLE IF EXISTS public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.organization_api_keys ENABLE ROW LEVEL SECURITY;

-- 2. LIMPAR TODAS AS POLÍTICAS EXISTENTES (Slate limpo)
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 3. FUNÇÃO AUXILIAR PARA PEGAR ORG_ID (SECURITY DEFINER para ignorar RLS da profiles)
CREATE OR REPLACE FUNCTION public.get_auth_organization_id()
RETURNS uuid AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. FUNÇÃO AUXILIAR PARA CHECAR ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. POLÍTICAS PARA 'ORGANIZATIONS'
CREATE POLICY "Users see their own organization" ON organizations
FOR SELECT USING (id = public.get_auth_organization_id());

-- 6. POLÍTICAS PARA 'PROFILES'
CREATE POLICY "Strict Profile Access" ON profiles
FOR SELECT USING (
    organization_id = public.get_auth_organization_id()
    AND (id = auth.uid() OR public.is_admin())
);

-- 7. POLÍTICAS PARA 'LEADS' (O CORAÇÃO DO PROBLEMA)
-- Vendedores: Apenas seus próprios leads
-- Admins: Todos os leads da sua organização
-- Anônimos: NADA (Default do RLS sem política)

CREATE POLICY "Lead Isolation Policy" ON leads
FOR ALL USING (
    organization_id = public.get_auth_organization_id()
    AND (
        user_id = auth.uid() 
        OR public.is_admin()
    )
)
WITH CHECK (
    organization_id = public.get_auth_organization_id()
    AND (
        user_id = auth.uid() 
        OR public.is_admin()
    )
);

-- 8. POLÍTICAS PARA API KEYS
CREATE POLICY "Admin API Key Access" ON organization_api_keys
FOR ALL USING (
    organization_id = public.get_auth_organization_id()
    AND public.is_admin()
);

-- 9. GARANTIR QUE O USUÁRIO PRINCIPAL É ADMIN
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'paulofernandoautomacao@gmail.com';

COMMIT;
