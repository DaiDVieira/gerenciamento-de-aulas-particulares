-- Remove nome e sobrenome columns from administradores table
ALTER TABLE public.administradores 
DROP COLUMN IF EXISTS nome,
DROP COLUMN IF EXISTS sobrenome;