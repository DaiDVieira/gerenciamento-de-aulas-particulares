import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Professor {
  id: string;
  nome: string;
  sobrenome: string;
  ativo: boolean;
}

interface Aluno {
  id: string;
  nome: string;
  sobrenome: string;
  ativo: boolean;
}

const AulasCadastro = () => {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(true);

  const [professores, setProfessores] = useState<Professor[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [selectedAlunos, setSelectedAlunos] = useState<Aluno[]>([]);
  const [date, setDate] = useState<Date>();

  const [formData, setFormData] = useState({
    professor_id: '',
    horario: '',
    sala: '',
    valor_aula: '',
    pagamento_confirmado: false,
  });

  useEffect(() => {
    fetchProfessores();
    fetchAlunos();
  }, []);

  const fetchProfessores = async () => {
    const { data } = await supabase
      .from('professores')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (data) setProfessores(data);
  };

  const fetchAlunos = async () => {
    const { data } = await supabase
      .from('alunos')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (data) setAlunos(data);
  };

  const handleAddAluno = (alunoId: string) => {
    if (selectedAlunos.length >= 2) {
      toast.error('Máximo de 2 alunos por aula');
      return;
    }
    const aluno = alunos.find(a => a.id === alunoId);
    if (aluno) setSelectedAlunos([...selectedAlunos, aluno]);
  };

  const handleRemoveAluno = (alunoId: string) => {
    setSelectedAlunos(selectedAlunos.filter(a => a.id !== alunoId));
  };

  const checkConflicts = async (
    data: string,
    horario: string,
    professorId: string,
    aluno1Id: string,
    aluno2Id?: string
  ) => {
    const { data: conflictingAulas } = await supabase
      .from('aulas')
      .select('*')
      .eq('data', data)
      .eq('horario', horario);

    for (const aula of conflictingAulas || []) {
      if (aula.professor_id === professorId) {
        toast.error('Professor já possui aula neste horário');
        return false;
      }
      if (aula.aluno1_id === aluno1Id || aula.aluno2_id === aluno1Id) {
        toast.error('Aluno já possui aula neste horário');
        return false;
      }
      if (aluno2Id && (aula.aluno1_id === aluno2Id || aula.aluno2_id === aluno2Id)) {
        toast.error('Aluno já possui aula neste horário');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.professor_id || !date || !formData.horario || selectedAlunos.length === 0 || !formData.valor_aula) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const dataFormatted = format(date, "yyyy-MM-dd");
    const aluno1Id = selectedAlunos[0].id;
    const aluno2Id = selectedAlunos[1]?.id;

    const canProceed = await checkConflicts(
      dataFormatted,
      formData.horario,
      formData.professor_id,
      aluno1Id,
      aluno2Id
    );

    if (!canProceed) return;

    const dataToSave = {
      professor_id: formData.professor_id,
      aluno1_id: aluno1Id,
      aluno2_id: aluno2Id || null,
      data: dataFormatted,
      horario: formData.horario,
      sala: formData.sala || null,
      observacoes: null,
      valor_aula: Number(formData.valor_aula),
      valor_professor: null,
      pagamento_confirmado: formData.pagamento_confirmado,
    };

    const { error } = await supabase.from("aulas").insert([dataToSave]);

    if (error) {
      toast.error("Erro ao cadastrar aula");
      console.error(error);
      return;
    }

    toast.success("Aula cadastrada com sucesso!");
    setIsDialogOpen(false);
    navigate("/aulas");
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar nova aula</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Data + Horário */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Selecione a data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-12 justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Horário *</Label>
              <Input
                type="time"
                value={formData.horario}
                onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                required
                className="h-12"
              />
            </div>
          </div>

          {/* Professor */}
          <div className="space-y-2">
            <Label>Professor *</Label>
            <Select
              value={formData.professor_id}
              onValueChange={(v) => setFormData({ ...formData, professor_id: v })}
            >
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {professores.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome} {p.sobrenome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sala */}
          <div className="space-y-2">
            <Label>Sala</Label>
            <Input
              value={formData.sala}
              onChange={(e) => setFormData({ ...formData, sala: e.target.value })}
              placeholder="Número da sala"
              className="h-12"
            />
          </div>

          {/* Selecionar aluno */}
          <div className="space-y-2">
            <Label>Selecionar aluno *</Label>
            <Select onValueChange={handleAddAluno}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {alunos
                  .filter(a => !selectedAlunos.some(s => s.id === a.id))
                  .map((aluno) => (
                    <SelectItem key={aluno.id} value={aluno.id}>
                      {aluno.nome} {aluno.sobrenome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lista de alunos */}
          {selectedAlunos.length > 0 && (
            <div className="space-y-2">
              <Label>Alunos selecionados</Label>
              {selectedAlunos.map((aluno) => (
                <Card key={aluno.id} className="p-4 flex justify-between items-center">
                  <strong>{aluno.nome} {aluno.sobrenome}</strong>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveAluno(aluno.id)}>
                    <X size={18} />
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {/* Valor da aula */}
          <div className="space-y-2">
            <Label>Valor da aula *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.valor_aula}
              onChange={(e) => setFormData({ ...formData, valor_aula: e.target.value })}
              required
            />
          </div>

          {/* Checkbox Pagamento */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.pagamento_confirmado}
              onChange={(e) =>
                setFormData({ ...formData, pagamento_confirmado: e.target.checked })
              }
            />
            <Label>Pagamento confirmado</Label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => navigate("/aulas")}>
              Cancelar
            </Button>
            <Button type="submit">Cadastrar Aula</Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AulasCadastro;
