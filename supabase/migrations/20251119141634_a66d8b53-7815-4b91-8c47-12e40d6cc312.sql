-- Criar enum para roles de administradores
CREATE TYPE public.app_role AS ENUM ('admin', 'super_admin');

-- Tabela de administradores
CREATE TABLE public.administradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  sobrenome VARCHAR(100) NOT NULL,
  celular VARCHAR(20) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  ativo BOOLEAN DEFAULT true NOT NULL,
  is_base_admin BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela de roles para controle de acesso
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

-- Tabela de professores
CREATE TABLE public.professores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL,
  sobrenome VARCHAR(100) NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  data_nascimento DATE NOT NULL CHECK (data_nascimento <= CURRENT_DATE),
  email VARCHAR(255) UNIQUE NOT NULL,
  celular VARCHAR(20) NOT NULL,
  endereco TEXT,
  disciplinas TEXT[] NOT NULL,
  ativo BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tabela de aulas
CREATE TABLE public.aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professor_id UUID REFERENCES public.professores(id) NOT NULL,
  aluno1_id UUID REFERENCES public.alunos(id) NOT NULL,
  aluno2_id UUID REFERENCES public.alunos(id),
  data DATE NOT NULL,
  horario TIME NOT NULL,
  disciplina VARCHAR(100) NOT NULL,
  sala VARCHAR(50),
  status VARCHAR(20) DEFAULT 'agendada' NOT NULL,
  valor_aula DECIMAL(10, 2),
  valor_professor DECIMAL(10, 2),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT alunos_diferentes CHECK (aluno1_id != aluno2_id)
);

-- Função helper para verificar role de usuário
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

-- Função para verificar se usuário é admin ativo
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

-- Enable RLS em todas as tabelas
ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alunos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para administradores
CREATE POLICY "Admins ativos podem visualizar administradores"
  ON public.administradores FOR SELECT
  TO authenticated
  USING (public.is_active_admin(auth.uid()));

CREATE POLICY "Admins ativos podem criar administradores"
  ON public.administradores FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin(auth.uid()));

CREATE POLICY "Admins ativos podem atualizar administradores (exceto base)"
  ON public.administradores FOR UPDATE
  TO authenticated
  USING (public.is_active_admin(auth.uid()) AND NOT is_base_admin);

CREATE POLICY "Admins não podem excluir admin base"
  ON public.administradores FOR DELETE
  TO authenticated
  USING (public.is_active_admin(auth.uid()) AND NOT is_base_admin);

-- Políticas RLS para user_roles
CREATE POLICY "Admins ativos podem gerenciar roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_active_admin(auth.uid()));

-- Políticas RLS para alunos
CREATE POLICY "Admins ativos podem visualizar alunos"
  ON public.alunos FOR SELECT
  TO authenticated
  USING (public.is_active_admin(auth.uid()));

CREATE POLICY "Admins ativos podem criar alunos"
  ON public.alunos FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin(auth.uid()));

CREATE POLICY "Admins ativos podem atualizar alunos"
  ON public.alunos FOR UPDATE
  TO authenticated
  USING (public.is_active_admin(auth.uid()));

CREATE POLICY "Admins não podem excluir alunos (apenas inativar)"
  ON public.alunos FOR DELETE
  TO authenticated
  USING (false);

-- Políticas RLS para professores
CREATE POLICY "Admins ativos podem visualizar professores"
  ON public.professores FOR SELECT
  TO authenticated
  USING (public.is_active_admin(auth.uid()));

CREATE POLICY "Admins ativos podem criar professores"
  ON public.professores FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin(auth.uid()));

CREATE POLICY "Admins ativos podem atualizar professores"
  ON public.professores FOR UPDATE
  TO authenticated
  USING (public.is_active_admin(auth.uid()));

CREATE POLICY "Admins não podem excluir professores (apenas inativar)"
  ON public.professores FOR DELETE
  TO authenticated
  USING (false);

-- Políticas RLS para aulas
CREATE POLICY "Admins ativos podem visualizar aulas"
  ON public.aulas FOR SELECT
  TO authenticated
  USING (public.is_active_admin(auth.uid()));

CREATE POLICY "Admins ativos podem criar aulas"
  ON public.aulas FOR INSERT
  TO authenticated
  WITH CHECK (public.is_active_admin(auth.uid()));

CREATE POLICY "Admins ativos podem atualizar aulas"
  ON public.aulas FOR UPDATE
  TO authenticated
  USING (public.is_active_admin(auth.uid()));

CREATE POLICY "Admins ativos podem excluir aulas"
  ON public.aulas FOR DELETE
  TO authenticated
  USING (public.is_active_admin(auth.uid()));

-- Triggers para atualização de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Índices para performance
CREATE INDEX idx_administradores_email ON public.administradores(email);
CREATE INDEX idx_administradores_user_id ON public.administradores(user_id);
CREATE INDEX idx_alunos_email ON public.alunos(email);
CREATE INDEX idx_professores_cpf ON public.professores(cpf);
CREATE INDEX idx_professores_email ON public.professores(email);
CREATE INDEX idx_aulas_data ON public.aulas(data);
CREATE INDEX idx_aulas_professor_id ON public.aulas(professor_id);
CREATE INDEX idx_aulas_aluno1_id ON public.aulas(aluno1_id);
CREATE INDEX idx_aulas_aluno2_id ON public.aulas(aluno2_id);