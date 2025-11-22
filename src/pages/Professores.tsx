import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Search, Edit, UserX } from 'lucide-react';
import { ConfirmInactivateDialog } from '@/components/dialogs/ConfirmInactivateDialog';
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
import { Badge } from '@/components/ui/badge';

interface Professor {
  id: string;
  nome: string;
  sobrenome: string;
  cpf: string;
  data_nascimento: string;
  email: string;
  celular: string;
  endereco: string;
  ativo: boolean;
}

const Professores = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [inactivateDialogOpen, setInactivateDialogOpen] = useState(false);
  const [selectedProfessorId, setSelectedProfessorId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    cpf: '',
    data_nascimento: '',
    email: '',
    celular: '',
    endereco: '',
  });

  useEffect(() => {
    fetchProfessores();
  }, []);

  useEffect(() => {
    const action = (location.state as any)?.action;
    if (action === 'register') {
      resetForm();
      setIsDialogOpen(true);
      // Clear the state to prevent reopening on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchProfessores = async () => {
    const { data, error } = await supabase
      .from('professores')
      .select('*')
      .order('nome');

    if (error) {
      toast.error('Erro ao carregar professores');
      console.error(error);
    } else {
      setProfessores(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProfessor) {
        const { error } = await supabase
          .from('professores')
          .update(formData)
          .eq('id', editingProfessor.id);

        if (error) throw error;
        toast.success('Professor atualizado com sucesso');
      } else {
        const { error } = await supabase.from('professores').insert([formData]);

        if (error) throw error;
        toast.success('Professor cadastrado com sucesso');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchProfessores();
    } catch (error: any) {
      if (error.code === '23505') {
        if (error.message.includes('cpf')) {
          toast.error('CPF já cadastrado');
        } else {
          toast.error('E-mail já cadastrado');
        }
      } else {
        toast.error('Erro ao salvar professor');
      }
      console.error(error);
    }
  };

  const handleEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setFormData({
      nome: professor.nome,
      sobrenome: professor.sobrenome,
      cpf: professor.cpf,
      data_nascimento: professor.data_nascimento,
      email: professor.email,
      celular: professor.celular,
      endereco: professor.endereco || '',
    });
    setIsDialogOpen(true);
  };

  const handleInactivate = async () => {
    if (!selectedProfessorId) return;

    const { error } = await supabase
      .from('professores')
      .update({ ativo: false })
      .eq('id', selectedProfessorId);

    if (error) {
      toast.error('Erro ao inativar professor');
      console.error(error);
    } else {
      toast.success('Professor inativado com sucesso');
      fetchProfessores();
    }
    setSelectedProfessorId(null);
  };

  const handleActivate = async (id: string) => {
    const { error } = await supabase
      .from('professores')
      .update({ ativo: true })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao ativar professor');
    } else {
      toast.success('Professor ativado com sucesso');
      fetchProfessores();
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      sobrenome: '',
      cpf: '',
      data_nascimento: '',
      email: '',
      celular: '',
      endereco: '',
    });
    setEditingProfessor(null);
  };

  const filteredProfessores = professores.filter((professor) =>
    `${professor.nome} ${professor.sobrenome} ${professor.email}`
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
              onClick={() => navigate('/gerenciamento')}
            >
              <ArrowLeft size={16} />
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Professores</h1>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus size={18} />
            Novo Professor
          </Button>
        </div>

        <Card className="p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar professor..."
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
                <TableHead>CPF</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfessores.map((professor) => (
                <TableRow key={professor.id}>
                  <TableCell className="font-medium">
                    {professor.nome} {professor.sobrenome}
                  </TableCell>
                  <TableCell>{professor.email}</TableCell>
                  <TableCell>{professor.cpf}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        professor.ativo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {professor.ativo ? 'Ativo' : 'Inativo'}
                    </span>
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
                {editingProfessor ? 'Editar Professor' : 'Novo Professor'}
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
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) =>
                      setFormData({ ...formData, cpf: e.target.value })
                    }
                    required
                    disabled={!!editingProfessor}
                  />
                </div>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  {editingProfessor ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmInactivateDialog
          open={inactivateDialogOpen}
          onOpenChange={setInactivateDialogOpen}
          onConfirm={handleInactivate}
          entityName="professor"
        />
      </div>
    </div>
  );
};

export default Professores;
