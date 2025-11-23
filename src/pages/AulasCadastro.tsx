import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { CalendarIcon, X } from "lucide-react";
import { format, differenceInHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NotificationDialog } from "@/components/dialogs/NotificationDialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  celular_responsavel: string;
}

const AulasCadastro = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const editingAula = (location.state as any)?.aula ?? null;
  const [isDialogOpen, setIsDialogOpen] = useState(true);
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false);
  const [notificationData, setNotificationData] = useState<{
    studentNames: string[];
    date: string;
    time: string;
  }>({ studentNames: [], date: "", time: "" });

  const [professores, setProfessores] = useState<Professor[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [selectedAlunos, setSelectedAlunos] = useState<Aluno[]>([]);
  const [date, setDate] = useState<Date>();

  const [formData, setFormData] = useState({
    professor_id: "",
    horario: "",
    sala: "",
    valor_aula: "",
    pagamento_confirmado: false,
  });

  useEffect(() => {
    fetchProfessores();
    fetchAlunos();
  }, []);

  useEffect(() => {
    if (!editingAula) return;

    setFormData({
      professor_id: editingAula.professor_id,
      horario: editingAula.horario,
      sala: editingAula.sala || "",
      valor_aula: editingAula.valor_aula != null ? String(editingAula.valor_aula) : "",
      pagamento_confirmado: editingAula.pagamento_confirmado ?? false,
    });

    if (editingAula.data) {
      const [year, month, day] = editingAula.data.split("-").map(Number);
      setDate(new Date(year, month - 1, day));
    }
  }, [editingAula]);

  useEffect(() => {
    if (!editingAula || alunos.length === 0) return;

    const lista: Aluno[] = [];

    const a1 = alunos.find(a => a.id === editingAula.aluno1_id);
    if (a1) lista.push(a1);

    if (editingAula.aluno2_id) {
      const a2 = alunos.find(a => a.id === editingAula.aluno2_id);
      if (a2) lista.push(a2);
    }

    setSelectedAlunos(lista);
  }, [alunos, editingAula]);

  const fetchProfessores = async () => {
    const { data } = await supabase.from("professores").select("*").eq("ativo", true).order("nome");
    if (data) setProfessores(data);
  };

  const fetchAlunos = async () => {
    const { data } = await supabase.from("alunos").select("*").eq("ativo", true).order("nome");
    if (data) setAlunos(data);
  };

  const handleAddAluno = (alunoId: string) => {
    if (selectedAlunos.length >= 2) {
      toast.error("Máximo de 2 alunos por aula");
      return;
    }
    const aluno = alunos.find(a => a.id === alunoId);
    if (aluno) setSelectedAlunos([...selectedAlunos, aluno]);
  };

  const handleRemoveAluno = (alunoId: string) => {
    setSelectedAlunos(selectedAlunos.filter(a => a.id !== alunoId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.professor_id ||
      !date ||
      !formData.horario ||
      selectedAlunos.length === 0 ||
      !formData.valor_aula
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const dataFormatted = format(date, "yyyy-MM-dd");
    const aluno1Id = selectedAlunos[0].id;
    const aluno2Id = selectedAlunos[1]?.id ?? null;

    const payload = {
      professor_id: formData.professor_id,
      aluno1_id: aluno1Id,
      aluno2_id: aluno2Id,
      data: dataFormatted,
      horario: formData.horario,
      sala: formData.sala || null,
      observacoes: null,
      valor_aula: Number(formData.valor_aula),
      valor_professor: Number(formData.valor_aula)*3/4,
      pagamento_confirmado: formData.pagamento_confirmado,
    };

    // Verificar se a aula está a menos de 24 horas de antecedência
    const [hours, minutes] = formData.horario.split(":").map(Number);
    const aulaDateTime = new Date(date);
    aulaDateTime.setHours(hours, minutes, 0, 0);
    const now = new Date();
    const hoursDifference = differenceInHours(aulaDateTime, now);

    const shouldShowNotification = hoursDifference < 24 && hoursDifference >= 0;

    if (editingAula) {
      const { error } = await supabase
        .from("aulas")
        .update(payload)
        .eq("id", editingAula.id);

      if (error) {
        toast.error("Erro ao atualizar aula");
        return;
      }

      if (shouldShowNotification) {
        // Simular envio de notificação
        const studentNames = selectedAlunos.map(
          (aluno) => `${aluno.nome} ${aluno.sobrenome}`
        );
        setNotificationData({
          studentNames,
          date: format(date, "dd/MM/yyyy", { locale: ptBR }),
          time: formData.horario,
        });
        setIsNotificationDialogOpen(true);

        // Simular chamada à edge function
        try {
          await supabase.functions.invoke("send-whatsapp-notification", {
            body: {
              to: selectedAlunos[0].celular_responsavel,
              message: `Aula alterada para ${format(date, "dd/MM/yyyy")} às ${formData.horario}`,
              type: "alteracao",
            },
          });
        } catch (err) {
          console.log("Simulação de notificação:", err);
        }
      } else {
        toast.success("Aula atualizada!");
        navigate("/aulas");
      }
      return;
    }

    const { error } = await supabase.from("aulas").insert([payload]);

    if (error) {
      toast.error("Erro ao cadastrar aula");
      return;
    }

    if (shouldShowNotification) {
      // Simular envio de notificação
      const studentNames = selectedAlunos.map(
        (aluno) => `${aluno.nome} ${aluno.sobrenome}`
      );
      setNotificationData({
        studentNames,
        date: format(date, "dd/MM/yyyy", { locale: ptBR }),
        time: formData.horario,
      });
      setIsNotificationDialogOpen(true);

      // Simular chamada à edge function
      try {
        await supabase.functions.invoke("send-whatsapp-notification", {
          body: {
            to: selectedAlunos[0].celular_responsavel,
            message: `Aula agendada para ${format(date, "dd/MM/yyyy")} às ${formData.horario}`,
            type: "criacao",
          },
        });
      } catch (err) {
        console.log("Simulação de notificação:", err);
      }
    } else {
      toast.success("Aula cadastrada!");
      navigate("/aulas");
    }
  };

  return (
    <>
      <NotificationDialog
        open={isNotificationDialogOpen}
        onOpenChange={(open) => {
          setIsNotificationDialogOpen(open);
          if (!open) {
            toast.success(editingAula ? "Aula atualizada!" : "Aula cadastrada!");
            navigate("/aulas");
          }
        }}
        studentNames={notificationData.studentNames}
        date={notificationData.date}
        time={notificationData.time}
      />
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingAula ? "Editar Aula" : "Cadastrar Nova Aula"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Data + horário */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
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

            <div>
              <Label>Horário *</Label>
              <Input
                type="time"
                value={formData.horario}
                onChange={(e) =>
                  setFormData({ ...formData, horario: e.target.value })
                }
                required
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
          <div>
            <Label>Sala</Label>
            <Input
              value={formData.sala}
              onChange={(e) =>
                setFormData({ ...formData, sala: e.target.value })
              }
              placeholder="Sala"
            />
          </div>

          {/* Alunos */}
          <div className="space-y-2">
            <Label>Selecionar aluno *</Label>
            <Select onValueChange={handleAddAluno}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                {alunos
                  .filter((a) => !selectedAlunos.some((s) => s.id === a.id))
                  .map((aluno) => (
                    <SelectItem key={aluno.id} value={aluno.id}>
                      {aluno.nome} {aluno.sobrenome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* lista alunos */}
          {selectedAlunos.length > 0 && (
            <div className="space-y-2">
              <Label>Alunos selecionados</Label>
              {selectedAlunos.map((aluno) => (
                <Card
                  key={aluno.id}
                  className="p-4 flex justify-between items-center"
                >
                  <strong>
                    {aluno.nome} {aluno.sobrenome}
                  </strong>
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

          {/* valor aula */}
          <div>
            <Label>Valor da Aula *</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.valor_aula}
              onChange={(e) =>
                setFormData({ ...formData, valor_aula: e.target.value })
              }
              required
            />
          </div>

          {/* checkbox pagamento */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.pagamento_confirmado}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pagamento_confirmado: e.target.checked,
                })
              }
            />
            <Label>Pagamento confirmado</Label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => navigate("/aulas")}>
              Cancelar
            </Button>
            <Button type="submit">
              {editingAula ? "Atualizar Aula" : "Cadastrar Aula"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default AulasCadastro;
