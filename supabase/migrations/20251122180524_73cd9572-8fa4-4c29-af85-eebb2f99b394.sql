-- Remove disciplina column from aulas table
ALTER TABLE public.aulas DROP COLUMN IF EXISTS disciplina;

-- Remove disciplinas column from professores table
ALTER TABLE public.professores DROP COLUMN IF EXISTS disciplinas;