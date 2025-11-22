import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const entityConfig = {
  alunos: { singular: 'aluno', plural: 'Alunos' },
  professores: { singular: 'professor', plural: 'Professores' },
  aulas: { singular: 'aula', plural: 'Aulas' },
  administradores: { singular: 'administrador', plural: 'Administradores' },
};

const EntityOptions = () => {
  const navigate = useNavigate();
  const { entity } = useParams<{ entity: string }>();
  
  const config = entity ? entityConfig[entity as keyof typeof entityConfig] : null;

  if (!config) {
    navigate('/gerenciamento');
    return null;
  }

  const handleAction = (action: string) => {
    navigate(`/${entity}`, { state: { action } });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/gerenciamento')}
          className="absolute top-8 right-8"
        >
          <ArrowLeft size={20} />
        </Button>

        <Card className="p-12 border border-border rounded-3xl">
          <div className="flex items-center gap-8">
            <div className="flex gap-6 flex-1 justify-center">
              <Button
                onClick={() => handleAction('inactivate')}
                className="h-64 w-32 bg-[#2d5f4a] hover:bg-[#2d5f4a]/90 text-white rounded-3xl text-lg font-medium writing-mode-vertical"
                style={{ writingMode: 'vertical-rl' }}
              >
                Inativar
              </Button>
              <Button
                onClick={() => handleAction('edit')}
                className="h-64 w-32 bg-[#2d5f4a] hover:bg-[#2d5f4a]/90 text-white rounded-3xl text-lg font-medium writing-mode-vertical"
                style={{ writingMode: 'vertical-rl' }}
              >
                Editar
              </Button>
              <Button
                onClick={() => handleAction('search')}
                className="h-64 w-32 bg-[#2d5f4a] hover:bg-[#2d5f4a]/90 text-white rounded-3xl text-lg font-medium writing-mode-vertical"
                style={{ writingMode: 'vertical-rl' }}
              >
                Pesquisar
              </Button>
              <Button
                onClick={() => handleAction('register')}
                className="h-64 w-32 bg-[#2d5f4a] hover:bg-[#2d5f4a]/90 text-white rounded-3xl text-lg font-medium writing-mode-vertical"
                style={{ writingMode: 'vertical-rl' }}
              >
                Cadastrar
              </Button>
            </div>
            
            <div className="writing-mode-vertical text-right">
              <h1 
                className="text-4xl font-bold text-foreground"
                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
              >
                O que você quer fazer com o *{config.singular}*?
              </h1>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EntityOptions;
