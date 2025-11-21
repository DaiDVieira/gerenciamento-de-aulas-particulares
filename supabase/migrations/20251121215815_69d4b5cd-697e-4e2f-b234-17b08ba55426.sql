-- Update is_active_admin function to use SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_active_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.administradores
    WHERE user_id = _user_id AND ativo = true
  );
$$;