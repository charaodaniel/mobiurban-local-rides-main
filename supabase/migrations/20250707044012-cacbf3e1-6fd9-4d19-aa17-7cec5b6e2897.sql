
-- Criar tabela de perfis de usuário se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email text NOT NULL,
  name text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Política para usuários visualizarem seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Política para usuários atualizarem seu próprio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    CASE 
      WHEN new.email = 'danielcharaomachado@hotmail.com' THEN 'admin'
      ELSE 'user'
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Inserir o usuário admin manualmente se ele já existir no auth.users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'danielcharaomachado@hotmail.com') THEN
    INSERT INTO public.profiles (id, email, name, role)
    SELECT id, email, COALESCE(raw_user_meta_data->>'name', 'Admin'), 'admin'
    FROM auth.users 
    WHERE email = 'danielcharaomachado@hotmail.com'
    ON CONFLICT (id) DO UPDATE SET role = 'admin';
  END IF;
END $$;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Política para admins visualizarem todos os perfis
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Atualizar políticas da tabela users para permitir que admins vejam todos os usuários
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (public.is_admin(auth.uid()));

-- Permitir que admins insiram novos usuários
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Permitir que admins atualizem usuários
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- Permitir que admins deletem usuários
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users" ON public.users
  FOR DELETE USING (public.is_admin(auth.uid()));

-- Atualizar políticas da tabela driver_profiles para admins
DROP POLICY IF EXISTS "Admins can view all drivers" ON public.driver_profiles;
CREATE POLICY "Admins can view all drivers" ON public.driver_profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all drivers" ON public.driver_profiles;
CREATE POLICY "Admins can update all drivers" ON public.driver_profiles
  FOR UPDATE USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete drivers" ON public.driver_profiles;
CREATE POLICY "Admins can delete drivers" ON public.driver_profiles
  FOR DELETE USING (public.is_admin(auth.uid()));
