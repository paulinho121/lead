
-- Função para permitir que vendedores vejam quais estados estão disponíveis no pool
-- Sem precisar de acesso direto (SELECT) à tabela de leads via RLS.

CREATE OR REPLACE FUNCTION public.get_pool_states()
RETURNS TABLE (uf TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT l.uf
    FROM public.leads l
    WHERE l.user_id IS NULL
    AND l.uf IS NOT NULL
    AND l.uf <> ''
    AND l.organization_id = public.get_auth_organization_id();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
