import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const menuOptions = [
    { title: 'Alunos', path: '/alunos' },
    { title: 'Aulas', path: '/aulas' },
    { title: 'Professores', path: '/professores' },
    { title: 'Administradores', path: '/administradores' },
    { title: 'Gerar Relatório Financeiro', path: '/relatorios' },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Gerenciamento</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="gap-2"
          >
            <LogOut size={16} />
            Sair
          </Button>
        </div>

        <Card className="p-8 border border-border rounded-lg">
          <div className="space-y-3">
            {menuOptions.slice(0, 3).map((option) => (
              <Button
                key={option.path}
                onClick={() => navigate(option.path)}
                className="w-full h-32 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl"
              >
                {option.title}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            {menuOptions.slice(3).map((option) => (
              <Button
                key={option.path}
                onClick={() => navigate(option.path)}
                className="h-32 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl"
              >
                {option.title}
              </Button>
            ))}
          </div>

          <div className="mt-6 space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">Outras opções</h2>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-foreground hover:bg-accent"
                onClick={() => navigate('/dashboard')}
              >
                Voltar ao menu principal
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
