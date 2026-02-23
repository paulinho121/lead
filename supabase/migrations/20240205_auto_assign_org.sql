
-- Trigger para auto-atribuir novos usuários à organização principal
-- Caso não venham de um convite (que já atribui na criação)

CREATE OR REPLACE FUNCTION public.handle_new_user_organization()
RETURNS TRIGGER AS $$
DECLARE
    v_main_org_id UUID;
BEGIN
    -- Só age se o usuário ainda não tiver organização
    IF NEW.organization_id IS NULL THEN
        -- Busca a organização mais antiga ou a principal
        SELECT id INTO v_main_org_id FROM public.organizations ORDER BY created_at ASC LIMIT 1;
        
        -- Atribui se encontrar
        IF v_main_org_id IS NOT NULL THEN
            NEW.organization_id := v_main_org_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_assign_org ON public.profiles;
CREATE TRIGGER on_profile_created_assign_org
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_organization();
