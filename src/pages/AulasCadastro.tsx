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

  const handleAddAluno = (alunoId: string) => {
    if (selectedAlunos.length >= 2) {
      toast.error('Máximo de 2 alunos por aula');
      return;
    }

    const aluno = alunos.find(a => a.id === alunoId);
    if (aluno && !selectedAlunos.find(a => a.id === alunoId)) {
      setSelectedAlunos([...selectedAlunos, aluno]);
    }
  };

  const handleRemoveAluno = (alunoId: string) => {
    setSelectedAlunos(selectedAlunos.filter(a => a.id !== alunoId));
  };

  const checkConflicts = async (data: string, horario: string, professorId: string, aluno1Id: string, aluno2Id?: string) => {
    const { data: conflictingAulas, error } = await supabase
      .from('aulas')
      .select('*')
      .eq('data', data)
      .eq('horario', horario);

    if (error) {
      console.error(error);
      return false;
    }

    for (const aula of conflictingAulas || []) {
      if (aula.professor_id === professorId) {
        toast.error('Professor já possui aula neste horário');
        return false;
      }
      if (aula.aluno1_id === aluno1Id || (aluno2Id && aula.aluno1_id === aluno2Id)) {
        toast.error('Aluno já possui aula neste horário');
        return false;
      }
      if (aula.aluno2_id && (aula.aluno2_id === aluno1Id || (aluno2Id && aula.aluno2_id === aluno2Id))) {
        toast.error('Aluno já possui aula neste horário');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.professor_id || selectedAlunos.length === 0 || !date || !formData.horario) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const dataFormatted = format(date, 'yyyy-MM-dd');
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
      valor_professor: valorProfessor,
    };

    try {
      const { error } = await supabase.from('aulas').insert([dataToSave]);

      if (error) throw error;
      
      toast.success('Aula cadastrada com sucesso');
      navigate('/aulas');
    } catch (error: any) {
      toast.error('Erro ao cadastrar aula');
      console.error(error);
    }
  };

  const numAlunos = selectedAlunos.length;
  const valorAula = numAlunos === 1 ? 80 : numAlunos === 2 ? 120 : 0;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/aulas')}
          className="absolute top-8 right-8"
        >
          <ArrowUp className="rotate-0" size={24} />
        </Button>

        <div className="grid grid-cols-[200px_1fr] gap-8 mt-16">
          {/* Left sidebar with submit button */}
          <div className="flex flex-col">
            <Button
              onClick={handleSubmit}
              className="h-[500px] bg-[#2d5f4a] hover:bg-[#2d5f4a]/90 text-white rounded-3xl text-2xl font-medium"
            >
              Cadastrar
            </Button>
          </div>

          {/* Main form content */}
          <Card className="p-8 border border-border rounded-3xl">
            <h1 className="text-4xl font-bold text-foreground mb-8 text-right">
              Cadastrar nova aula
            </h1>

            <form className="space-y-6">
              {/* Date and Time Selection */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-lg">Selecione a data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal h-12 rounded-xl"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                    onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                    className="h-12 rounded-xl"
                    required
                  />
                </div>
              </div>

              {/* Professor Selection */}
              <div className="space-y-2">
                <Label className="text-lg">Selecione o professor</Label>
                <Select
                  value={formData.professor_id}
                  onValueChange={(value) => setFormData({ ...formData, professor_id: value })}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Selecione uma opção" />
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

              {/* Room Selection */}
              <div className="space-y-2">
                <Label htmlFor="sala" className="text-lg">Selecione a sala</Label>
                <Input
                  id="sala"
                  value={formData.sala}
                  onChange={(e) => setFormData({ ...formData, sala: e.target.value })}
                  placeholder="Digite o número da sala"
                  className="h-12 rounded-xl"
                />
              </div>

              {/* Student Selection */}
              <div className="space-y-2">
                <Label className="text-lg">Selecione o aluno</Label>
                <Select onValueChange={handleAddAluno}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="Digite o nome ou matrícula do aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {alunos
                      .filter(a => !selectedAlunos.find(sa => sa.id === a.id))
                      .map((aluno) => (
                        <SelectItem key={aluno.id} value={aluno.id}>
                          {aluno.nome} {aluno.sobrenome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected Students */}
              {selectedAlunos.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-lg">Alunos Selecionados</Label>
                  <div className="space-y-2">
                    {selectedAlunos.map((aluno) => (
                      <Card key={aluno.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">Nome do Aluno</p>
                          <p className="text-sm text-muted-foreground">
                            {aluno.nome} {aluno.sobrenome}
                          </p>
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
                </div>
              )}

              {/* Class Value Display */}
              {valorAula > 0 && (
                <div className="space-y-2">
                  <Label className="text-lg">Valor da aula</Label>
                  <div className="p-4 bg-muted rounded-xl">
                    <p className="text-2xl font-bold">R$ {valorAula},00</p>
                  </div>
                </div>
              )}
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AulasCadastro;
