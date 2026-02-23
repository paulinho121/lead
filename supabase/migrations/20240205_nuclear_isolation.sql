
-- Refinamento de Segurança: Isolamento Total (Nuclear)
-- Objetivo: Garantir que vendedores NÃO VEJAM NADA de outros usuários, inclusive o pool

BEGIN;

-- 1. Melhorar a política de LEADS
-- Vendedores: Apenas leads atribuídos a eles
-- Admins: Todos os leads da organização
DROP POLICY IF EXISTS "Users can only see leads from their organization" ON leads;

CREATE POLICY "Strict Lead Isolation" ON leads
FOR SELECT USING (
  organization_id = public.get_auth_organization_id()
  AND (
    user_id = auth.uid()         -- Apenas meus leads
    OR public.is_admin()         -- Admins veem tudo da org
  )
);

-- Para INSERT/UPDATE/DELETE, mantemos a lógica de dono ou admin
CREATE POLICY "Strict Lead Management" ON leads
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

-- 2. Refinar a política de PROFILES (Opcional, se quiser ocultar outros usuários)
-- Vamos deixar visível apenas para admins ou se forem da mesma equipe
DROP POLICY IF EXISTS "Users can see team members" ON profiles;
CREATE POLICY "Team visibility" ON profiles
FOR SELECT USING (
  id = auth.uid() OR public.is_admin()
);

-- 3. Função para limpar leads órfãos de sessões antigas (Opcional)
-- Mas o foco aqui é o isolamento visual agora.

COMMIT;
