-- ================================================
-- RESTAURAÇÃO COMPLETA DO SCHEMA ORIGINAL
-- Remove disciplina e desabilita RLS
-- ================================================

-- Dropar todas as policies existentes
DROP POLICY IF EXISTS "Admins ativos podem visualizar administradores" ON public.administradores;
DROP POLICY IF EXISTS "Admins ativos podem criar administradores" ON public.administradores;
DROP POLICY IF EXISTS "Admins ativos podem atualizar administradores (exceto base)" ON public.administradores;
DROP POLICY IF EXISTS "Admins não podem excluir admin base" ON public.administradores;
DROP POLICY IF EXISTS "Authenticated users can manage administradores" ON public.administradores;

DROP POLICY IF EXISTS "Admins ativos podem gerenciar roles" ON public.user_roles;

DROP POLICY IF EXISTS "Admins ativos podem visualizar alunos" ON public.alunos;
DROP POLICY IF EXISTS "Admins ativos podem criar alunos" ON public.alunos;
DROP POLICY IF EXISTS "Admins ativos podem atualizar alunos" ON public.alunos;
DROP POLICY IF EXISTS "Admins não podem excluir alunos (apenas inativar)" ON public.alunos;
DROP POLICY IF EXISTS "Authenticated users can manage alunos" ON public.alunos;

DROP POLICY IF EXISTS "Admins ativos podem visualizar professores" ON public.professores;
DROP POLICY IF EXISTS "Admins ativos podem criar professores" ON public.professores;
DROP POLICY IF EXISTS "Admins ativos podem atualizar professores" ON public.professores;
DROP POLICY IF EXISTS "Admins não podem excluir professores (apenas inativar)" ON public.professores;
DROP POLICY IF EXISTS "Authenticated users can manage professores" ON public.professores;

DROP POLICY IF EXISTS "Admins ativos podem visualizar aulas" ON public.aulas;
DROP POLICY IF EXISTS "Admins ativos podem criar aulas" ON public.aulas;
DROP POLICY IF EXISTS "Admins ativos podem atualizar aulas" ON public.aulas;
DROP POLICY IF EXISTS "Admins ativos podem excluir aulas" ON public.aulas;
DROP POLICY IF EXISTS "Authenticated users can manage aulas" ON public.aulas;

-- Desabilitar RLS em todas as tabelas
ALTER TABLE IF EXISTS public.administradores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.alunos DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.professores DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.aulas DISABLE ROW LEVEL SECURITY;

-- Dropar triggers existentes
DROP TRIGGER IF EXISTS update_administradores_updated_at ON public.administradores;
DROP TRIGGER IF EXISTS update_alunos_updated_at ON public.alunos;
DROP TRIGGER IF EXISTS update_professores_updated_at ON public.professores;
DROP TRIGGER IF EXISTS update_aulas_updated_at ON public.aulas;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Dropar tabelas na ordem correta (respeitando foreign keys)
DROP TABLE IF EXISTS public.aulas CASCADE;
DROP TABLE IF EXISTS public.professores CASCADE;
DROP TABLE IF EXISTS public.alunos CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.administradores CASCADE;

-- Dropar tipo enum
DROP TYPE IF EXISTS public.app_role CASCADE;

-- ================================================
-- RECRIAR SCHEMA ORIGINAL
-- ================================================

-- Recriar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin');

-- Tabela de administradores (com nome e sobrenome restaurados)
CREATE TABLE public.administradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  sobrenome VARCHAR(100) NOT NULL,
  celular VARCHAR(20) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha TEXT,
  ativo BOOLEAN DEFAULT true NOT NULL,
  is_base_admin BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela de roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Tabela de alunos
CREATE TABLE public.alunos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  sobrenome VARCHAR(100) NOT NULL,
  data_nascimento DATE NOT NULL CHECK (data_nascimento <= CURRENT_DATE),
  email VARCHAR(255) UNIQUE NOT NULL,
  celular VARCHAR(20) NOT NULL,
  celular_responsavel VARCHAR(20) NOT NULL,
  nome_responsavel VARCHAR(200) NOT NULL,
  endereco TEXT,
  ativo BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela de professores (SEM coluna disciplinas)
CREATE TABLE public.professores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  sobrenome VARCHAR(100) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  data_nascimento DATE NOT NULL CHECK (data_nascimento <= CURRENT_DATE),
  email VARCHAR(255) UNIQUE NOT NULL,
  celular VARCHAR(20) NOT NULL,
  endereco TEXT,
  ativo BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela de aulas (SEM coluna disciplina)
CREATE TABLE public.aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID REFERENCES public.professores(id) NOT NULL,
  aluno1_id UUID REFERENCES public.alunos(id) NOT NULL,
  aluno2_id UUID REFERENCES public.alunos(id),
  data DATE NOT NULL,
  horario TIME NOT NULL,
  sala VARCHAR(50),
  status VARCHAR(20) DEFAULT 'agendada' NOT NULL,
  valor_aula DECIMAL(10, 2),
  valor_professor DECIMAL(10, 2),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT alunos_diferentes CHECK (aluno1_id != aluno2_id)
);

-- Recriar funções helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

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
  )
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar triggers de updated_at
CREATE TRIGGER update_administradores_updated_at
  BEFORE UPDATE ON public.administradores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alunos_updated_at
  BEFORE UPDATE ON public.alunos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_professores_updated_at
  BEFORE UPDATE ON public.professores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_aulas_updated_at
  BEFORE UPDATE ON public.aulas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar registro de administrador automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_admin_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_admin_user();

-- Recriar índices
CREATE INDEX idx_administradores_email ON public.administradores(email);
CREATE INDEX idx_administradores_user_id ON public.administradores(user_id);
CREATE INDEX idx_alunos_email ON public.alunos(email);
CREATE INDEX idx_professores_cpf ON public.professores(cpf);
CREATE INDEX idx_professores_email ON public.professores(email);
CREATE INDEX idx_aulas_data ON public.aulas(data);
CREATE INDEX idx_aulas_professor_id ON public.aulas(professor_id);
CREATE INDEX idx_aulas_aluno1_id ON public.aulas(aluno1_id);
CREATE INDEX idx_aulas_aluno2_id ON public.aulas(aluno2_id);