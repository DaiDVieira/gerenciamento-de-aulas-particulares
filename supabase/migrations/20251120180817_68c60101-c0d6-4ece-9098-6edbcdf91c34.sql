-- Add senha column to administradores table for storing administrator password (hashed or reference)
ALTER TABLE public.administradores
ADD COLUMN IF NOT EXISTS senha text;