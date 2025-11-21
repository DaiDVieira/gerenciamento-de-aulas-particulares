import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const Setup = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const createBaseAdmin = async () => {
    setLoading(true);
    try {
      // First, try to sign in to check if user already exists
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@sistema.com',
        password: 'Admin@123',
      });

      if (!signInError) {
        // User exists and password is correct, just verify admin record exists
        const { data: session } = await supabase.auth.getSession();
        
        if (session.session?.user) {
          // Check if admin record exists
          const { data: adminData } = await supabase
            .from('administradores')
            .select('id')
            .eq('email', 'admin@sistema.com')
            .maybeSingle();

          if (!adminData) {
            // Create admin record manually (trigger might not have worked)
            const { error: insertError } = await supabase
              .from('administradores')
              .insert({
                user_id: session.session.user.id,
                nome: 'Administrador',
                sobrenome: 'Base',
                email: 'admin@sistema.com',
                celular: '(00) 00000-0000',
                ativo: true,
                is_base_admin: true
              });

            if (insertError) throw insertError;
          }
        }

        await supabase.auth.signOut();
        toast.success('Administrador base já existe e está configurado!');
        toast.info('Use: admin@sistema.com / Admin@123');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      // User doesn't exist or wrong password, try to create
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'admin@sistema.com',
        password: 'Admin@123',
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nome: 'Administrador',
            sobrenome: 'Base'
          }
        }
      });

      if (authError) {
        // If user already exists but wrong password was tried
        if (authError.message?.includes('User already registered')) {
          toast.error('Usuário já existe. Use a senha correta ou entre em contato com o suporte.');
          return;
        }
        throw authError;
      }

      if (authData.user) {
        toast.success('Administrador base criado com sucesso!');
        toast.info('Use: admin@sistema.com / Admin@123');
        
        await supabase.auth.signOut();
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error: any) {
      console.error('Erro ao criar administrador base:', error);
      toast.error(error.message || 'Erro ao criar administrador base');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Configuração Inicial</CardTitle>
          <CardDescription>
            Crie o administrador base para começar a usar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Ao clicar no botão abaixo, será criado:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Email: admin@sistema.com</li>
              <li>Senha: Admin@123</li>
            </ul>
            <p className="text-amber-600 dark:text-amber-500 mt-4">
              ⚠️ Recomendamos alterar a senha após o primeiro login.
            </p>
          </div>
          
          <Button 
            onClick={createBaseAdmin} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Criando...' : 'Criar Administrador Base'}
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/login')}
            className="w-full"
          >
            Voltar para Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Setup;
