import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

const Setup = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSetup = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/setup-base-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (data.message === 'Base admin already exists') {
          toast.success('Administrador base já existe! Você pode fazer login.');
        } else {
          throw new Error(data.error || 'Erro ao criar administrador');
        }
      } else {
        toast.success('Administrador base criado com sucesso!');
      }

      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      console.error('Setup error:', error);
      toast.error(error.message || 'Erro ao configurar sistema');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-foreground">
          Configuração Inicial
        </h1>

        <Card className="p-8 border border-border rounded-lg shadow-sm">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Bem-vindo!
              </h2>
              <p className="text-muted-foreground">
                Clique no botão abaixo para criar o administrador base do sistema.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
              <p className="font-medium text-foreground">Credenciais do Administrador Base:</p>
              <p className="text-muted-foreground">
                <span className="font-medium">Email:</span> admin@sistema.com
              </p>
              <p className="text-muted-foreground">
                <span className="font-medium">Senha:</span> Admin@123
              </p>
            </div>

            <Button
              onClick={handleSetup}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6 rounded-lg"
              disabled={isLoading}
            >
              {isLoading ? 'Configurando...' : 'Criar Administrador Base'}
            </Button>

            <Button
              onClick={() => navigate('/login')}
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              Voltar para Login
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Setup;
