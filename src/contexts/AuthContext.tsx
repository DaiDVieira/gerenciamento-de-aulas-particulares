import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface AuthContextType {
  user: any;
  session: any;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const signIn = async (email: string, password: string) => {
    setLoading(true);

    try {
      // Login via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        toast.error("Credenciais inválidas");
        return;
      }

      const signedUser = authData.user;

      // Validar se o usuário é admin na tabela administradores
      const { data: adminData, error: adminError } = await supabase
        .from("administradores")
        .select("*")
        .eq("user_id", signedUser.id)
        .eq("ativo", true)
        .maybeSingle();

      if (!adminData || adminError) {
        toast.error("Usuário não é administrador ativo");
        await supabase.auth.signOut();
        return;
      }

      // Login OK
      setUser(signedUser);
      setSession(authData.session);

      toast.success("Login realizado com sucesso");
      navigate("/gerenciamento");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao tentar login");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
    toast.success("Logout realizado");
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
