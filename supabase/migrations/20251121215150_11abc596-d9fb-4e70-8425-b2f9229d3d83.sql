-- Drop the existing policy
DROP POLICY IF EXISTS "Admins ativos podem visualizar administradores" ON public.administradores;

-- Create the updated policy with self-access
CREATE POLICY "Admins ativos podem visualizar administradores"
ON public.administradores
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR
  public.is_active_admin(auth.uid())
);