
-- Garantir isolamento total entre usuários (Anti-Vazamento)
-- Apenas o dono do lead ou o administrador pode visualizar/editar

BEGIN;

-- 1. Função para verificar se o usuário é administrador
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Atualizar política de leads para Isolamento Atômico
-- O usuário vê: Leads dele, Leads sem dono (pool) ou TUDO se for admin da org
DROP POLICY IF EXISTS "Users can only see leads from their organization" ON leads;

CREATE POLICY "Users can only see leads from their organization" ON leads
FOR ALL USING (
  organization_id = public.get_auth_organization_id() -- Filtro de Empresa
  AND (
    user_id = auth.uid()         -- Meus leads
    OR user_id IS NULL           -- Pool público da empresa
    OR public.is_admin()         -- Sou admin, vejo tudo da empresa
  )
);

-- 3. Garantir que o Administrador Principal tenha a role correta
-- Isso evita que o dono da conta fique bloqueado
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'paulofernandoautomacao@gmail.com';

-- 4. Impedir que um vendedor mude o dono do lead (user_id) manualmente
-- Apenas via RPC ou Admins
CREATE POLICY "Prevent user_id hijacking" ON leads
FOR UPDATE
USING (
  organization_id = public.get_auth_organization_id()
  AND (user_id = auth.uid() OR public.is_admin())
)
WITH CHECK (
  organization_id = public.get_auth_organization_id()
  AND (user_id = auth.uid() OR public.is_admin())
);

COMMIT;
