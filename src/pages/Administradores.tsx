import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Search, Edit, Trash2 } from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/dialogs/ConfirmDeleteDialog';
import { ErrorDialog } from '@/components/dialogs/ErrorDialog';
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

interface Administrador {
  id: string;
  user_id: string;
  celular: string;
  email: string;
  ativo: boolean;
  is_base_admin: boolean;
}

const Administradores = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Administrador | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Administrador | null>(null);
  const [action, setAction] = useState<string>('');
  const [formData, setFormData] = useState({
    celular: '',
    email: '',
    senha: '',
  });

  useEffect(() => {
    fetchAdministradores();
    const currentAction = (location.state as any)?.action;
    if (currentAction) {
      setAction(currentAction);
    }
  }, [location]);

  useEffect(() => {
    const action = (location.state as any)?.action;
    if (action === 'register') {
      resetForm();
      setIsDialogOpen(true);
      // Clear the state to prevent reopening on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchAdministradores = async () => {
    const { data, error } = await supabase
      .from('administradores')
      .select('*')
      .order('email');

    if (error) {
      toast.error('Erro ao carregar administradores');
      console.error(error);
    } else {
      setAdministradores(data || []);
    }
  };

  const validatePassword = (password: string): boolean => {
    if (password.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres');
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      toast.error('A senha deve conter pelo menos uma letra maiúscula');
      return false;
    }
    if (!/[a-z]/.test(password)) {
      toast.error('A senha deve conter pelo menos uma letra minúscula');
      return false;
    }
    if (!/[0-9]/.test(password)) {
      toast.error('A senha deve conter pelo menos um número');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingAdmin) {
        // Update existing admin
        const { error } = await supabase
          .from('administradores')
          .update({
            celular: formData.celular,
            email: formData.email,
          })
          .eq('id', editingAdmin.id);

        if (error) throw error;
        toast.success('Administrador atualizado com sucesso');
      } else {
        // Create new admin
        if (!validatePassword(formData.senha)) return;

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.senha,
        });

        if (authError) throw authError;

        if (!authData.user) {
          throw new Error('Erro ao criar usuário');
        }

        // Create admin record
        const { error: adminError } = await supabase
          .from('administradores')
          .insert([
            {
              user_id: authData.user.id,
              celular: formData.celular,
              email: formData.email,
              ativo: true,
              is_base_admin: false,
            },
          ]);

        if (adminError) throw adminError;

        // Add admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([
            {
              user_id: authData.user.id,
              role: 'admin',
            },
          ]);

        if (roleError) throw roleError;

        toast.success('Administrador cadastrado com sucesso');
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAdministradores();
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('E-mail já cadastrado');
      } else {
        toast.error(error.message || 'Erro ao salvar administrador');
      }
      console.error(error);
    }
  };

  const handleEdit = (admin: Administrador) => {
    setEditingAdmin(admin);
    setFormData({
      celular: admin.celular,
      email: admin.email,
      senha: '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedAdmin) return;

    const { error } = await supabase
      .from('administradores')
      .delete()
      .eq('id', selectedAdmin.id);

    if (error) {
      toast.error('Erro ao excluir administrador');
      console.error(error);
    } else {
      toast.success('Administrador excluído com sucesso');
      fetchAdministradores();
    }
    setSelectedAdmin(null);
  };

  const handleRowClick = (admin: Administrador) => {
    if (action === 'edit') {
      // Only allow editing own information
      if (user?.id === admin.user_id || (user?.id === 'admin-base' && admin.is_base_admin)) {
        handleEdit(admin);
      } else {
        toast.error('Você só pode editar suas próprias informações');
      }
    } else if (action === 'delete') {
      handleDeleteClick(admin);
    } else if (action === 'search') {
      // Just view, no action
      return;
    }
  };

  const handleDeleteClick = (admin: Administrador) => {
    if (admin.is_base_admin) {
      setErrorDialogOpen(true);
      return;
    }
    setSelectedAdmin(admin);
    setDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      celular: '',
      email: '',
      senha: '',
    });
    setEditingAdmin(null);
  };

  const filteredAdmins = administradores.filter((admin) =>
    admin.email
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
            <h1 className="text-3xl font-bold text-foreground">Administradores</h1>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsDialogOpen(true);
            }}
            className="gap-2"
          >
            <Plus size={18} />
            Novo Administrador
          </Button>
        </div>

        <Card className="p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Buscar administrador..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Celular</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdmins.map((admin) => (
                <TableRow 
                  key={admin.id}
                  onClick={() => handleRowClick(admin)}
                  className={action && action !== 'register' ? 'cursor-pointer hover:bg-muted/50' : ''}
                >
                  <TableCell className="font-medium">
                    {admin.email}
                    {admin.is_base_admin && (
                      <span className="ml-2 text-xs text-muted-foreground">(Base)</span>
                    )}
                  </TableCell>
                  <TableCell>{admin.celular}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        admin.ativo
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {admin.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAdmin ? 'Editar Administrador' : 'Novo Administrador'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={!!editingAdmin}
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

              {!editingAdmin && (
                <div>
                  <Label htmlFor="senha">Senha *</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) =>
                      setFormData({ ...formData, senha: e.target.value })
                    }
                    required
                    placeholder="Mínimo 8 caracteres, maiúscula, minúscula e número"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Mínimo 8 caracteres, incluindo maiúscula, minúscula e número
                  </p>
                </div>
              )}

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
                  {editingAdmin ? 'Atualizar' : 'Cadastrar'}
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

        <ErrorDialog
          open={errorDialogOpen}
          onOpenChange={setErrorDialogOpen}
          title="Exclusão impossível"
          description="Você tentou excluir o registro do Administrador base. Essa ação não pode ser realizada."
        />
      </div>
    </div>
  );
};

export default Administradores;
