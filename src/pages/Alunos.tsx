import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Search, Edit, UserX } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Aluno {
  id: string;
  nome: string;
  sobrenome: string;
  data_nascimento: string;
  email: string;
  celular: string;
  celular_responsavel: string;
  nome_responsavel: string;
  endereco: string;
  ativo: boolean;
}

const Alunos = () => {
  const navigate = useNavigate();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    data_nascimento: '',
    email: '',
    celular: '',
    celular_responsavel: '',
    nome_responsavel: '',
    endereco: '',
  });

  useEffect(() => {
    fetchAlunos();
  }, []);

  const fetchAlunos = async () => {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .order('nome');

    if (error) {
      toast.error('Erro ao carregar alunos');
      console.error(error);
    } else {
      setAlunos(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingAluno) {
        const { error } = await supabase
          .from('alunos')
          .update(formData)
          .eq('id', editingAluno.id);

        if (error) throw error;
        toast.success('Aluno atualizado com sucesso');
      } else {
        const { error } = await supabase.from('alunos').insert([formData]);

        if (error) throw error;
        toast.success('Aluno cadastrado com sucesso');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAlunos();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('E-mail já cadastrado');
      } else {
        toast.error('Erro ao salvar aluno');
      }
      console.error(error);
    }
  };

  const handleEdit = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setFormData({
      nome: aluno.nome,
      sobrenome: aluno.sobrenome,
      data_nascimento: aluno.data_nascimento,
      email: aluno.email,
      celular: aluno.celular,
      celular_responsavel: aluno.celular_responsavel,
      nome_responsavel: aluno.nome_responsavel,
      endereco: aluno.endereco || '',
    });
    setIsDialogOpen(true);
  };

  const handleInactivate = async (id: string) => {
    if (!confirm('Deseja inativar este aluno?')) return;

    const { error } = await supabase
      .from('alunos')
      .update({ ativo: false })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao inativar aluno');
      console.error(error);
    } else {
      toast.success('Aluno inativado com sucesso');
      fetchAlunos();
    }
  };

  const handleActivate = async (id: string) => {
    const { error } = await supabase
      .from('alunos')
      .update({ ativo: true })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao ativar aluno');
    } else {
      toast.success('Aluno ativado com sucesso');
      fetchAlunos();
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      sobrenome: '',
      data_nascimento: '',
      email: '',
      celular: '',
      celular_responsavel: '',
      nome_responsavel: '',
      endereco: '',
    });
    setEditingAluno(null);
  };

  const filteredAlunos = alunos.filter((aluno) =>
    `${aluno.nome} ${aluno.sobrenome} ${aluno.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft size={16} />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus size={18} />
            Novo Aluno
          </Button>
        </div>

        <Card className="p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Celular</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlunos.map((aluno) => (
                <TableRow key={aluno.id}>
                  <TableCell className="font-medium">
                    {aluno.nome} {aluno.sobrenome}
                  </TableCell>
                  <TableCell>{aluno.email}</TableCell>
                  <TableCell>{aluno.celular}</TableCell>
                  <TableCell>{aluno.nome_responsavel}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        aluno.ativo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {aluno.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(aluno)}
                      >
                        <Edit size={14} />
                      </Button>
                      {aluno.ativo ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInactivate(aluno.id)}
                        >
                          <UserX size={14} />
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleActivate(aluno.id)}
                        >
                          Ativar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingAluno ? 'Editar Aluno' : 'Novo Aluno'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sobrenome">Sobrenome *</Label>
                  <Input
                    id="sobrenome"
                    value={formData.sobrenome}
                    onChange={(e) =>
                      setFormData({ ...formData, sobrenome: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                  <Input
                    id="data_nascimento"
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        data_nascimento: e.target.value,
                      })
                    }
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="celular">Celular *</Label>
                  <Input
                    id="celular"
                    value={formData.celular}
                    onChange={(e) =>
                      setFormData({ ...formData, celular: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="celular_responsavel">
                    Celular Responsável *
                  </Label>
                  <Input
                    id="celular_responsavel"
                    value={formData.celular_responsavel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        celular_responsavel: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="nome_responsavel">Nome do Responsável *</Label>
                <Input
                  id="nome_responsavel"
                  value={formData.nome_responsavel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nome_responsavel: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) =>
                    setFormData({ ...formData, endereco: e.target.value })
                  }
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingAluno ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Alunos;
