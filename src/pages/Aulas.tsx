import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/dialogs/ConfirmDeleteDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Aula {
  id: string;
  professor_id: string;
  aluno1_id: string;
  aluno2_id: string | null;
  data: string;
  horario: string;
  disciplina: string;
  sala: string | null;
  status: string;
  valor_aula: number | null;
  valor_professor: number | null;
  observacoes: string | null;
  professores: { nome: string; sobrenome: string };
  alunos_aulas_aluno1_idToalunos: { nome: string; sobrenome: string };
  alunos_aulas_aluno2_idToalunos: { nome: string; sobrenome: string } | null;
}

interface Professor {
  id: string;
  nome: string;
  sobrenome: string;
  disciplinas: string[];
  ativo: boolean;
  celular: string;
  email: string;
}

interface Aluno {
  id: string;
  nome: string;
  sobrenome: string;
  ativo: boolean;
  email: string;
}

const Aulas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAula, setEditingAula] = useState<Aula | null>(null);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAulaId, setSelectedAulaId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    professor_id: '',
    aluno1_id: '',
    aluno2_id: '',
    data: '',
    horario: '',
    disciplina: '',
    sala: '',
    observacoes: '',
  });

  useEffect(() => {
    fetchAulas();
    fetchProfessores();
    fetchAlunos();
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

  const fetchAulas = async () => {
    const { data, error } = await supabase
      .from('aulas')
      .select(`
        *,
        professores!aulas_professor_id_fkey (nome, sobrenome),
        alunos_aulas_aluno1_idToalunos:alunos!aulas_aluno1_id_fkey (nome, sobrenome),
        alunos_aulas_aluno2_idToalunos:alunos!aulas_aluno2_id_fkey (nome, sobrenome)
      `)
      .order('data', { ascending: false })
      .order('horario', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar aulas');
      console.error(error);
    } else {
      setAulas(data || []);
    }
  };

  const fetchProfessores = async () => {
    const { data, error } = await supabase
      .from('professores')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error(error);
    } else {
      setProfessores(data || []);
    }
  };

  const fetchAlunos = async () => {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (error) {
      console.error(error);
    } else {
      setAlunos(data || []);
    }
  };

  const checkConflicts = async (data: string, horario: string, professorId: string, aluno1Id: string, aluno2Id: string, editingId?: string) => {
    const { data: conflictingAulas, error } = await supabase
      .from('aulas')
      .select('*')
      .eq('data', data)
      .eq('horario', horario)
      .neq('id', editingId || '');

    if (error) {
      console.error(error);
      return false;
    }

    for (const aula of conflictingAulas || []) {
      if (aula.professor_id === professorId) {
        toast.error('Professor já possui aula neste horário');
        return false;
      }
      if (aula.aluno1_id === aluno1Id || aula.aluno1_id === aluno2Id) {
        toast.error('Aluno já possui aula neste horário');
        return false;
      }
      if (aula.aluno2_id && (aula.aluno2_id === aluno1Id || aula.aluno2_id === aluno2Id)) {
        toast.error('Aluno já possui aula neste horário');
        return false;
      }
    }

    return true;
  };

  const sendNotifications = async (aula: any, action: 'criacao' | 'alteracao' | 'cancelamento') => {
    try {
      const professor = professores.find(p => p.id === aula.professor_id);
      const aluno1 = alunos.find(a => a.id === aula.aluno1_id);
      const aluno2 = aula.aluno2_id ? alunos.find(a => a.id === aula.aluno2_id) : null;

      const message = `
🎓 Aula ${action === 'criacao' ? 'Agendada' : action === 'alteracao' ? 'Alterada' : 'Cancelada'}

📚 Disciplina: ${aula.disciplina}
👨‍🏫 Professor: ${professor?.nome} ${professor?.sobrenome}
👨‍🎓 Aluno(s): ${aluno1?.nome} ${aluno1?.sobrenome}${aluno2 ? `, ${aluno2.nome} ${aluno2.sobrenome}` : ''}
📅 Data: ${new Date(aula.data + 'T00:00:00').toLocaleDateString('pt-BR')}
⏰ Horário: ${aula.horario}
${aula.sala ? `🚪 Sala: ${aula.sala}` : ''}
      `.trim();

      // Enviar WhatsApp
      await supabase.functions.invoke('send-whatsapp-notification', {
        body: { to: professor?.celular, message, type: action }
      });

      // Sincronizar Google Calendar
      const startDateTime = `${aula.data}T${aula.horario}:00`;
      const endTime = new Date(`${aula.data}T${aula.horario}`);
      endTime.setHours(endTime.getHours() + 1);
      const endDateTime = endTime.toISOString().slice(0, 16);

      await supabase.functions.invoke('sync-google-calendar', {
        body: {
          summary: `${aula.disciplina} - ${professor?.nome}`,
          description: message,
          startDateTime,
          endDateTime,
          attendees: [professor?.email || '', aluno1?.email || ''],
          action: action === 'criacao' ? 'create' : action === 'alteracao' ? 'update' : 'delete',
          eventId: aula.id
        }
      });
    } catch (error) {
      console.error('Erro ao enviar notificações:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.professor_id || !formData.aluno1_id) {
      toast.error('Professor e pelo menos um aluno são obrigatórios');
      return;
    }

    if (formData.aluno2_id && formData.aluno1_id === formData.aluno2_id) {
      toast.error('Os alunos devem ser diferentes');
      return;
    }

    const canProceed = await checkConflicts(
      formData.data,
      formData.horario,
      formData.professor_id,
      formData.aluno1_id,
      formData.aluno2_id,
      editingAula?.id
    );

    if (!canProceed) return;

    const numAlunos = formData.aluno2_id ? 2 : 1;
    const valorAula = numAlunos === 1 ? 80 : 120;
    const valorProfessor = numAlunos === 1 ? 40 : 60;

    const dataToSave = {
      ...formData,
      aluno2_id: formData.aluno2_id || null,
      sala: formData.sala || null,
      observacoes: formData.observacoes || null,
      valor_aula: valorAula,
      valor_professor: valorProfessor,
    };

    try {
      if (editingAula) {
        const { error } = await supabase
          .from('aulas')
          .update(dataToSave)
          .eq('id', editingAula.id);

        if (error) throw error;
        await sendNotifications({ ...dataToSave, id: editingAula.id }, 'alteracao');
        toast.success('Aula atualizada com sucesso');
      } else {
        const { data: newAula, error } = await supabase.from('aulas').insert([dataToSave]).select().single();

        if (error) throw error;
        await sendNotifications(newAula, 'criacao');
        toast.success('Aula agendada com sucesso');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAulas();
    } catch (error: any) {
      toast.error('Erro ao salvar aula');
      console.error(error);
    }
  };

  const handleEdit = (aula: Aula) => {
    setEditingAula(aula);
    const professor = professores.find(p => p.id === aula.professor_id);
    setSelectedProfessor(professor || null);
    setFormData({
      professor_id: aula.professor_id,
      aluno1_id: aula.aluno1_id,
      aluno2_id: aula.aluno2_id || '',
      data: aula.data,
      horario: aula.horario,
      disciplina: aula.disciplina,
      sala: aula.sala || '',
      observacoes: aula.observacoes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedAulaId) return;

    const aula = aulas.find(a => a.id === selectedAulaId);
    const { error } = await supabase.from('aulas').delete().eq('id', selectedAulaId);

    if (error) {
      toast.error('Erro ao excluir aula');
      console.error(error);
    } else {
      if (aula) {
        // Notify teacher and guardians (simulated)
        console.log('Notificação de cancelamento enviada');
      }
      toast.success('Aula excluída com sucesso');
      fetchAulas();
    }
    setSelectedAulaId(null);
  };

  const resetForm = () => {
    setFormData({
      professor_id: '',
      aluno1_id: '',
      aluno2_id: '',
      data: '',
      horario: '',
      disciplina: '',
      sala: '',
      observacoes: '',
    });
    setEditingAula(null);
    setSelectedProfessor(null);
  };

  const filteredAulas = aulas.filter((aula) => {
    const professorNome = `${aula.professores.nome} ${aula.professores.sobrenome}`;
    const aluno1Nome = `${aula.alunos_aulas_aluno1_idToalunos.nome} ${aula.alunos_aulas_aluno1_idToalunos.sobrenome}`;
    const searchString = `${professorNome} ${aluno1Nome} ${aula.disciplina}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

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
            <h1 className="text-3xl font-bold text-foreground">Aulas</h1>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus size={18} />
            Agendar Aula
          </Button>
        </div>

        <Card className="p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar aula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Professor</TableHead>
                <TableHead>Alunos</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Sala</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAulas.map((aula) => (
                <TableRow key={aula.id}>
                  <TableCell>
                    {new Date(aula.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>{aula.horario}</TableCell>
                  <TableCell>
                    {aula.professores.nome} {aula.professores.sobrenome}
                  </TableCell>
                  <TableCell>
                    {aula.alunos_aulas_aluno1_idToalunos.nome} {aula.alunos_aulas_aluno1_idToalunos.sobrenome}
                    {aula.alunos_aulas_aluno2_idToalunos && (
                      <>, {aula.alunos_aulas_aluno2_idToalunos.nome} {aula.alunos_aulas_aluno2_idToalunos.sobrenome}</>
                    )}
                  </TableCell>
                  <TableCell>{aula.disciplina}</TableCell>
                  <TableCell>{aula.sala || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(aula)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAulaId(aula.id);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 size={14} />
                      </Button>
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
                {editingAula ? 'Editar Aula' : 'Agendar Aula'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Professor *</Label>
                <Select
                  value={formData.professor_id}
                  onValueChange={(value) => {
                    setFormData({ ...formData, professor_id: value, disciplina: '' });
                    const prof = professores.find(p => p.id === value);
                    setSelectedProfessor(prof || null);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {professores.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id}>
                        {prof.nome} {prof.sobrenome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Disciplina *</Label>
                <Select
                  value={formData.disciplina}
                  onValueChange={(value) =>
                    setFormData({ ...formData, disciplina: value })
                  }
                  disabled={!selectedProfessor}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a disciplina" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProfessor?.disciplinas.map((disc, idx) => (
                      <SelectItem key={idx} value={disc}>
                        {disc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Aluno 1 *</Label>
                  <Select
                    value={formData.aluno1_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, aluno1_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {alunos.map((aluno) => (
                        <SelectItem key={aluno.id} value={aluno.id}>
                          {aluno.nome} {aluno.sobrenome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Aluno 2 (opcional)</Label>
                  <Select
                    value={formData.aluno2_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, aluno2_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {alunos
                        .filter(a => a.id !== formData.aluno1_id)
                        .map((aluno) => (
                          <SelectItem key={aluno.id} value={aluno.id}>
                            {aluno.nome} {aluno.sobrenome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data">Data *</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) =>
                      setFormData({ ...formData, data: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="horario">Horário *</Label>
                  <Input
                    id="horario"
                    type="time"
                    value={formData.horario}
                    onChange={(e) =>
                      setFormData({ ...formData, horario: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sala">Sala</Label>
                <Input
                  id="sala"
                  value={formData.sala}
                  onChange={(e) =>
                    setFormData({ ...formData, sala: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Input
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
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
                  {editingAula ? 'Atualizar' : 'Agendar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <ConfirmDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
};

export default Aulas;
