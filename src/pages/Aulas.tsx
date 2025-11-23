import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "@/components/dialogs/ConfirmDeleteDialog";

interface Aula {
  id: string;
  professor_id: string;
  aluno1_id: string;
  aluno2_id: string | null;
  data: string;
  horario: string;
  sala: string | null;
  valor_aula: number | null;
  valor_professor: number | null;
  pagamento_confirmado: boolean;
  observacoes: string | null;
  professores: { nome: string; sobrenome: string };
  alunos_aulas_aluno1_idToalunos: { nome: string; sobrenome: string };
  alunos_aulas_aluno2_idToalunos: { nome: string; sobrenome: string } | null;
}

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

const Aulas = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [aulas, setAulas] = useState<Aula[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAula, setEditingAula] = useState<Aula | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAulaId, setSelectedAulaId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    professor_id: "",
    aluno1_id: "",
    aluno2_id: "",
    data: "",
    horario: "",
    sala: "",
    valor_aula: "",
    pagamento_confirmado: false,
    observacoes: "",
  });

  useEffect(() => {
    fetchAulas();
    fetchProfessores();
    fetchAlunos();
  }, []);

  useEffect(() => {
    const action = (location.state as any)?.action;
    if (action === "register") {
      navigate("/aulas/cadastro");
      window.history.replaceState({}, document.title);
    }
  }, [location, navigate]);

  const fetchAulas = async () => {
    const { data, error } = await supabase
      .from("aulas")
      .select(`
        *,
        professores!aulas_professor_id_fkey (nome, sobrenome),
        alunos_aulas_aluno1_idToalunos:alunos!aulas_aluno1_id_fkey (nome, sobrenome),
        alunos_aulas_aluno2_idToalunos:alunos!aulas_aluno2_id_fkey (nome, sobrenome)
      `)
      .order("data", { ascending: false })
      .order("horario", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar aulas");
      console.error(error);
    } else {
      setAulas(data || []);
    }
  };

  const fetchProfessores = async () => {
    const { data } = await supabase
      .from("professores")
      .select("*")
      .eq("ativo", true)
      .order("nome");

    if (data) setProfessores(data);
  };

  const fetchAlunos = async () => {
    const { data } = await supabase
      .from("alunos")
      .select("*")
      .eq("ativo", true)
      .order("nome");

    if (data) setAlunos(data);
  };

  const checkConflicts = async (
    data: string,
    horario: string,
    professorId: string,
    aluno1Id: string,
    aluno2Id: string,
    editingId?: string
  ) => {
    const { data: conflictingAulas } = await supabase
      .from("aulas")
      .select("*")
      .eq("data", data)
      .eq("horario", horario)
      .neq("id", editingId || "");

    for (const aula of conflictingAulas || []) {
      if (aula.professor_id === professorId) {
        toast.error("Professor já possui aula neste horário");
        return false;
      }
      if (aula.aluno1_id === aluno1Id || aula.aluno1_id === aluno2Id) {
        toast.error("Aluno já possui aula neste horário");
        return false;
      }
      if (aula.aluno2_id && (aula.aluno2_id === aluno1Id || aula.aluno2_id === aluno2Id)) {
        toast.error("Aluno já possui aula neste horário");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.professor_id || !formData.aluno1_id) {
      toast.error("Professor e pelo menos um aluno são obrigatórios");
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

    const dataToSave = {
      ...formData,
      aluno2_id: formData.aluno2_id || null,
      valor_aula: Number(formData.valor_aula),
      valor_professor: null,
    };

    try {
      if (editingAula) {
        const { error } = await supabase
          .from("aulas")
          .update(dataToSave)
          .eq("id", editingAula.id);

        if (error) throw error;

        toast.success("Aula atualizada com sucesso");
      } else {
        await supabase.from("aulas").insert([dataToSave]);
        toast.success("Aula cadastrada com sucesso");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAulas();
    } catch (error) {
      toast.error("Erro ao salvar aula");
      console.error(error);
    }
  };

  const handleEdit = (aula: Aula) => {
    setEditingAula(aula);
    setFormData({
      professor_id: aula.professor_id,
      aluno1_id: aula.aluno1_id,
      aluno2_id: aula.aluno2_id || "",
      data: aula.data,
      horario: aula.horario,
      sala: aula.sala || "",
      valor_aula: aula.valor_aula?.toString() || "",
      pagamento_confirmado: aula.pagamento_confirmado,
      observacoes: aula.observacoes || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedAulaId) return;

    const { error } = await supabase.from("aulas").delete().eq("id", selectedAulaId);

    if (error) {
      toast.error("Erro ao excluir aula");
    } else {
      toast.success("Aula excluída com sucesso");
      fetchAulas();
    }

    setSelectedAulaId(null);
  };

  const resetForm = () => {
    setFormData({
      professor_id: "",
      aluno1_id: "",
      aluno2_id: "",
      data: "",
      horario: "",
      sala: "",
      valor_aula: "",
      pagamento_confirmado: false,
      observacoes: "",
    });
    setEditingAula(null);
  };

  const handleRowClick = (aula: Aula) => {
    const action = (location.state as any)?.action;
    if (action === "edit") {
      handleEdit(aula);
    } else if (action === "delete") {
      setSelectedAulaId(aula.id);
      setDeleteDialogOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">

        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/gerenciamento")}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-3xl font-bold">Aulas</h1>
        </div>

        <Card className="p-6 mb-6">
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <Input
              placeholder="Buscar aula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Professor</TableHead>
                <TableHead>Alunos</TableHead>
                <TableHead>Sala</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aulas
                .filter((aula) =>
                  `${aula.professores.nome} ${aula.professores.sobrenome}`
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                )
                .map((aula) => (
                  <TableRow
                    key={aula.id}
                    onClick={() => handleRowClick(aula)}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell>
                      {new Date(aula.data + "T00:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>{aula.horario}</TableCell>
                    <TableCell>
                      {aula.professores.nome} {aula.professores.sobrenome}
                    </TableCell>
                    <TableCell>
                      {aula.alunos_aulas_aluno1_idToalunos.nome}{" "}
                      {aula.alunos_aulas_aluno1_idToalunos.sobrenome}
                      {aula.alunos_aulas_aluno2_idToalunos && (
                        <>
                          , {aula.alunos_aulas_aluno2_idToalunos.nome}{" "}
                          {aula.alunos_aulas_aluno2_idToalunos.sobrenome}
                        </>
                      )}
                    </TableCell>
                    <TableCell>{aula.sala || "-"}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>

        {/* Modal de cadastro/edição */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingAula ? "Editar Aula" : "Cadastrar Aula"}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div>
                <Label>Professor *</Label>
                <Select
                  value={formData.professor_id}
                  onValueChange={(v) => setFormData({ ...formData, professor_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {professores.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome} {p.sobrenome}
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
                    onValueChange={(v) => setFormData({ ...formData, aluno1_id: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {alunos.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.nome} {a.sobrenome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Aluno 2 (opcional)</Label>
                  <Select
                    value={formData.aluno2_id}
                    onValueChange={(v) => setFormData({ ...formData, aluno2_id: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhum</SelectItem>
                      {alunos
                        .filter((a) => a.id !== formData.aluno1_id)
                        .map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.nome} {a.sobrenome}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Horário *</Label>
                  <Input
                    type="time"
                    value={formData.horario}
                    onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Sala</Label>
                <Input
                  value={formData.sala}
                  onChange={(e) => setFormData({ ...formData, sala: e.target.value })}
                />
              </div>

              <div>
                <Label>Valor da aula *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_aula}
                  onChange={(e) => setFormData({ ...formData, valor_aula: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.pagamento_confirmado}
                  onChange={(e) =>
                    setFormData({ ...formData, pagamento_confirmado: e.target.checked })
                  }
                />
                <Label>Pagamento confirmado</Label>
              </div>

              <div>
                <Label>Observações</Label>
                <Input
                  value={formData.observacoes}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingAula ? "Atualizar" : "Cadastrar"}</Button>
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
