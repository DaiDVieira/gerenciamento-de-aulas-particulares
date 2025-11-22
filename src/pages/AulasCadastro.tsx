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
import { ArrowUp, CalendarIcon, X } from 'lucide-react';
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
  });

  useEffect(() => {
    fetchProfessores();
    fetchAlunos();
  }, []);

  const fetchProfessores = async () => {
    const { data, error } = await supabase
      .from('professores')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (!error && data) setProfessores(data);
  };

  const fetchAlunos = async () => {
    const { data, error } = await supabase
      .from('alunos')
      .select('*')
      .eq('ativo', true)
      .order('nome');

    if (!error && data) setAlunos(data);
  };

  const handleAddAluno = (alunoId: string) => {
    if (selectedAlunos.length >= 2) {
      toast.error('Máximo de 2 alunos por aula');
      return;
    }
    const aluno = alunos.find(a => a.id === alunoId);
    if (aluno) {
      setSelectedAlunos([...selectedAlunos, aluno]);
    }
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

    if (!formData.professor_id || !date || !formData.horario || selectedAlunos.length === 0) {
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

    const numAlunos = selectedAlunos.length;
    const valorAula = numAlunos === 1 ? 80 : 120;
    const valorProfessor = numAlunos === 1 ? 40 : 60;

    const dataToSave = {
      professor_id: formData.professor_id,
      aluno1_id: aluno1Id,
      aluno2_id: aluno2Id || null,
      data: dataFormatted,
      horario: formData.horario,
      sala: formData.sala || null,
      observacoes: null,
      valor_aula: valorAula,
      valor_professor: valorProfessor
    };

    const { error } = await supabase.from("aulas").insert([dataToSave]);
    if (error) {
      toast.error("Erro ao cadastrar aula");
      return;
    }

    toast.success("Aula cadastrada com sucesso!");
    setIsDialogOpen(false);
    navigate("/aulas");
  };

  const valorAula =
    selectedAlunos.length === 1 ? 80 : selectedAlunos.length === 2 ? 120 : 0;

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar nova aula</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-lg">Selecione a data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left h-12 rounded-xl"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
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
              <Label htmlFor="horario" className="text-lg">Horário</Label>
              <Input
                id="horario"
                type="time"
                value={formData.horario}
                onChange={(e) =>
                  setFormData({ ...formData, horario: e.target.value })
                }
                required
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          {/* Professor */}
          <div className="space-y-2">
            <Label className="text-lg">Selecione o professor</Label>
            <Select
              value={formData.professor_id}
              onValueChange={(v) => setFormData({ ...formData, professor_id: v })}
            >
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Selecione uma opção" />
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
            <Label className="text-lg">Sala</Label>
            <Input
              id="sala"
              value={formData.sala}
              onChange={(e) =>
                setFormData({ ...formData, sala: e.target.value })
              }
              placeholder="Número da sala"
              className="h-12 rounded-xl"
            />
          </div>

          {/* Alunos */}
          <div className="space-y-2">
            <Label className="text-lg">Selecionar aluno</Label>
            <Select onValueChange={handleAddAluno}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {alunos
                  .filter((a) => !selectedAlunos.find((s) => s.id === a.id))
                  .map((aluno) => (
                    <SelectItem key={aluno.id} value={aluno.id}>
                      {aluno.nome} {aluno.sobrenome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Alunos selecionados */}
          {selectedAlunos.length > 0 && (
            <div className="space-y-2">
              <Label className="text-lg">Alunos selecionados</Label>

              {selectedAlunos.map((aluno) => (
                <Card
                  key={aluno.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{aluno.nome} {aluno.sobrenome}</p>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveAluno(aluno.id)}
                  >
                    <X size={18} />
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {/* Valor da aula */}
          {valorAula > 0 && (
            <div className="space-y-2">
              <Label className="text-lg">Valor da aula</Label>
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-2xl font-bold">R$ {valorAula},00</p>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => navigate("/aulas")}>
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
