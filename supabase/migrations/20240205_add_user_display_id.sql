
-- Adicionar ID sequencial humano para usuários (ex: Usuário 1, 2, 3)
-- Isso facilita a identificação sem usar UUIDs longos na conversa

BEGIN;

-- 1. Adicionar a coluna display_id se não existir
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_id SERIAL;

-- 2. Comentário explicativo
COMMENT ON COLUMN public.profiles.display_id IS 'ID numérico sequencial para fácil identificação dos vendedores.';

-- 3. Função para garantir que novos usuários tenham IDs consistentes (opcional, SERIAL resolve)
-- Mas vamos garantir que os IDs atuais façam sentido
-- Nota: SERIAL preencherá automaticamente para os existentes se for adicionado agora.

COMMIT;
