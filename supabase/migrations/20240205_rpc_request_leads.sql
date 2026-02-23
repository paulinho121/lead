
-- Primeiro removemos a função antiga para permitir a mudança do tipo de retorno (de void para integer)
DROP FUNCTION IF EXISTS public.solicitar_novos_leads(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.solicitar_novos_leads(vendedor_id UUID, p_uf TEXT DEFAULT NULL)
RETURNS integer AS $$
DECLARE
    v_org_id UUID;
    v_count INTEGER;
    v_limit INTEGER;
    v_assigned INTEGER;
BEGIN
    -- 1. Identificar a organização do vendedor
    SELECT organization_id INTO v_org_id FROM public.profiles WHERE id = vendedor_id;
    
    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Perfil não encontrado ou sem organização vinculada.';
    END IF;

    -- 2. Verificar quantos leads o vendedor já possui ativos
    SELECT count(*) INTO v_count 
    FROM public.leads 
    WHERE user_id = vendedor_id 
    AND (stage IS NULL OR stage NOT IN ('closed_won', 'closed_lost', 'disqualified'));

    IF v_count >= 10 THEN
        RAISE EXCEPTION 'Você já possui o limite de 10 leads ativos. Finalize os atuais para solicitar novos.';
    END IF;

    v_limit := 10 - v_count;
    IF v_limit > 5 THEN v_limit := 5; END IF;

    -- 3. Atribuir novos leads
    WITH assigned AS (
        UPDATE public.leads
        SET user_id = vendedor_id,
            updated_at = NOW()
        WHERE id IN (
            SELECT id
            FROM public.leads
            WHERE organization_id = v_org_id
            AND user_id IS NULL
            AND (p_uf IS NULL OR p_uf = '' OR uf = p_uf)
            ORDER BY captured_at ASC
            LIMIT v_limit
            FOR UPDATE SKIP LOCKED
        )
        RETURNING id
    )
    SELECT count(*) INTO v_assigned FROM assigned;

    RETURN v_assigned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
