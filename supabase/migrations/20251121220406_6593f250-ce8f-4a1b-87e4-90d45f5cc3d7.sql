-- Create function to handle new admin user creation
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only create admin record for admin@sistema.com email
  IF NEW.email = 'admin@sistema.com' THEN
    INSERT INTO public.administradores (
      user_id,
      nome,
      sobrenome,
      email,
      celular,
      ativo,
      is_base_admin
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nome', 'Administrador'),
      COALESCE(NEW.raw_user_meta_data->>'sobrenome', 'Base'),
      NEW.email,
      '(00) 00000-0000',
      true,
      true
    )
    ON CONFLICT (email) 
    DO UPDATE SET user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create admin record on auth user creation
DROP TRIGGER IF EXISTS on_auth_admin_user_created ON auth.users;
CREATE TRIGGER on_auth_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_admin_user();