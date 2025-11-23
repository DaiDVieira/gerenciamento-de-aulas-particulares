import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Search } from "lucide-react";

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
  observacoes: string | null;
  pagamento_confirmado: boolean;
  professores: { nome: string; sobrenome: string };
  alunos_aulas_aluno1_idToalunos: { nome: string; sobrenome: string };
  alunos_aulas_aluno2_idToalunos: { nome: string; sobrenome: string } | null;
}

const Aulas = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [aulas, setAulas] = useState<Aula[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAulaId, setSelectedAulaId] = useState<string | null>(null);
  const [action, setAction] = useState<string>("");

  useEffect(() => {
    const currentAction = (location.state as any)?.action ?? "";

    // Se a ação for CADASTRAR → pula lista e abre cadastro vazio
    if (currentAction === "register") {
      navigate("/aulas/cadastro", { state: {} });
      return;
    }

    setAction(currentAction);
    fetchAulas();
  }, [location]);

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
      return;
    }
    setAulas(data || []);
  };

  const handleRowClick = (aula: Aula) => {
    if (action === "edit") {
      navigate("/aulas/cadastro", { state: { aula } });
      return;
    }

    if (action === "delete") {
      setSelectedAulaId(aula.id);
      setDeleteDialogOpen(true);
      return;
    }
  };

  const handleDelete = async () => {
    if (!selectedAulaId) return;

    const { error } = await supabase
      .from("aulas")
      .delete()
      .eq("id", selectedAulaId);

    if (error) toast.error("Erro ao excluir aula");
    else toast.success("Aula excluída");

    fetchAulas();
    setDeleteDialogOpen(false);
    setSelectedAulaId(null);
  };

  const filteredAulas = aulas.filter((aula) => {
    const texto = `${aula.professores.nome} ${aula.professores.sobrenome} ${aula.alunos_aulas_aluno1_idToalunos.nome}`
      .toLowerCase();
    return texto.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/gerenciamento")}
          >
            <ArrowLeft size={16} />
          </Button>
          <h1 className="text-3xl font-bold">Aulas</h1>
        </div>

        <Card className="p-6">
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
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
              {filteredAulas.map((aula) => (
                <TableRow
                  key={aula.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(aula)}
                >
                  <TableCell>{new Date(aula.data).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell>{aula.horario}</TableCell>
                  <TableCell>
                    {aula.professores.nome} {aula.professores.sobrenome}
                  </TableCell>
                  <TableCell>
                    {aula.alunos_aulas_aluno1_idToalunos.nome}
                    {aula.alunos_aulas_aluno2_idToalunos &&
                      `, ${aula.alunos_aulas_aluno2_idToalunos.nome}`}
                  </TableCell>
                  <TableCell>{aula.sala || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

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
