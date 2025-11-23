-- Add pagamento_confirmado column to aulas table
ALTER TABLE public.aulas 
ADD COLUMN pagamento_confirmado boolean NOT NULL DEFAULT false;