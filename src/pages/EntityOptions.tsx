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
          <div className="flex flex-col items-center gap-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground text-center">
                O que você quer fazer com o *{config.singular}*?
              </h1>
            </div>
            
            <div className="flex gap-6 justify-center">
              <Button
                onClick={() => handleAction('inactivate')}
                className="w-32 h-64 bg-[#2d5f4a] hover:bg-[#2d5f4a]/90 text-white rounded-3xl text-lg font-medium"
              >
                Inativar
              </Button>
              <Button
                onClick={() => handleAction('edit')}
                className="w-32 h-64 bg-[#2d5f4a] hover:bg-[#2d5f4a]/90 text-white rounded-3xl text-lg font-medium"
              >
                Editar
              </Button>
              <Button
                onClick={() => handleAction('search')}
                className="w-32 h-64 bg-[#2d5f4a] hover:bg-[#2d5f4a]/90 text-white rounded-3xl text-lg font-medium"
              >
                Pesquisar
              </Button>
              <Button
                onClick={() => handleAction('register')}
                className="w-32 h-64 bg-[#2d5f4a] hover:bg-[#2d5f4a]/90 text-white rounded-3xl text-lg font-medium"
              >
                Cadastrar
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EntityOptions;
