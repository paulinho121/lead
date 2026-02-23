
-- Migration de Recuperação: Vincular usuários órfãos à organização principal
-- E garantir que a organização exista.

BEGIN;

-- 1. Identificar o ID da organização que já está nos leads (ou criar uma nova se não houver)
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    -- Tenta pegar a primeira organização que aparece nos leads
    SELECT organization_id INTO v_org_id FROM public.leads WHERE organization_id IS NOT NULL LIMIT 1;
    
    -- Se não houver organização nos leads, pega a primeira da tabela organizations
    IF v_org_id IS NULL THEN
        SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    END IF;

    -- Se ainda assim não existir nenhuma, cria a "Organização Matriz"
    IF v_org_id IS NULL THEN
        INSERT INTO public.organizations (name, niche, description)
        VALUES ('Multi-Calculadora Inteligente', 'Vendas Corporativas', 'Organização Principal')
        RETURNING id INTO v_org_id;
    END IF;

    -- 2. Vincular todos os perfis que não possuem organização a esta organização principal
    UPDATE public.profiles
    SET organization_id = v_org_id
    WHERE organization_id IS NULL;

    RAISE NOTICE 'Usuários vinculados à organização: %', v_org_id;
END $$;

COMMIT;
