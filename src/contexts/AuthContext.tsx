import { createContext, useContext, useState, ReactNode } from 'react';
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
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // =============================================================
  // 🔥 LOGIN PERSONALIZADO
  // =============================================================
  const signIn = async (email: string, password: string) => {
    setLoading(true);

    try {
      // =========================================================
      // 1) LOGIN DO ADMINISTRADOR BASE (ignora Supabase)
      // =========================================================
      if (email === "admin@sistema.com" && password === "Admin@123") {
        const baseUser = {
          id: "admin-base-local",
          email: "admin@sistema.com",
          is_base: true
        };

        setUser(baseUser);
        setSession({ user: baseUser });
        toast.success("Administrador base autenticado");
        navigate("/Gerenciamento");
        return;
      }

      // =========================================================
      // 2) LOGIN DE QUALQUER OUTRO USUÁRIO DO SUPABASE AUTH
      // =========================================================
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error || !data?.user) {
        toast.error("E-mail ou senha inválidos");
        return;
      }

      // Neste sistema: NÃO verificar se é administrador
      setUser(data.user);
      setSession(data.session);

      toast.success("Login realizado com sucesso");
      navigate("/Gerenciamento");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao realizar login");
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
