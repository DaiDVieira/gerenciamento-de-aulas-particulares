-- Remove existing RLS policies for administradores, professores, alunos, aulas
DROP POLICY IF EXISTS "Administradores can view their own data or if active admin" ON public.administradores;
DROP POLICY IF EXISTS "Active admins can insert administrators" ON public.administradores;
DROP POLICY IF EXISTS "Active admins can update administrators" ON public.administradores;
DROP POLICY IF EXISTS "Active admins can delete administrators" ON public.administradores;
DROP POLICY IF EXISTS "Active admins can view all students" ON public.alunos;
DROP POLICY IF EXISTS "Active admins can insert students" ON public.alunos;
DROP POLICY IF EXISTS "Active admins can update students" ON public.alunos;
DROP POLICY IF EXISTS "Active admins can delete students" ON public.alunos;
DROP POLICY IF EXISTS "Active admins can view all teachers" ON public.professores;
DROP POLICY IF EXISTS "Active admins can insert teachers" ON public.professores;
DROP POLICY IF EXISTS "Active admins can update teachers" ON public.professores;
DROP POLICY IF EXISTS "Active admins can delete teachers" ON public.professores;
DROP POLICY IF EXISTS "Active admins can view all classes" ON public.aulas;
DROP POLICY IF EXISTS "Active admins can insert classes" ON public.aulas;
DROP POLICY IF EXISTS "Active admins can update classes" ON public.aulas;
DROP POLICY IF EXISTS "Active admins can delete classes" ON public.aulas;

-- Create simple policies that allow all authenticated users to perform CRUD operations
-- Administradores
CREATE POLICY "Authenticated users can manage administradores"
ON public.administradores
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Alunos
CREATE POLICY "Authenticated users can manage alunos"
ON public.alunos
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Professores
CREATE POLICY "Authenticated users can manage professores"
ON public.professores
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Aulas
CREATE POLICY "Authenticated users can manage aulas"
ON public.aulas
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);