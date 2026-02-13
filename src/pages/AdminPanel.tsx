import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  CreditCard, 
  Settings, 
  ArrowLeft, 
  Plus, 
  Search,
  Edit,
  Trash2,
  Check,
  X,
  Shield,
  Mail,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type AdminView = 'users' | 'plans' | 'settings';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  slug: string | null;
  crp: string | null;
  specialty: string | null;
  subscription_status: string | null;
  subscription_plan: string | null;
  created_at: string;
  must_change_password: boolean | null;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  features: string[];
  is_active: boolean;
  max_documents_per_month: number | null;
  max_patients: number | null;
}

const AdminPanel: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [view, setView] = useState<AdminView>('users');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);

  // Plans state
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

  // New user form
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    name: '',
    password: '',
    subscription_status: 'trial' as const,
  });

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data, error } = await supabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });

      if (error || !data) {
        navigate('/app');
        return;
      }

      setIsAdmin(true);
      setIsLoading(false);
    };

    checkAdmin();
  }, [user, navigate]);

  // Load data
  useEffect(() => {
    if (!isAdmin) return;

    const loadData = async () => {
      // Load users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!usersError && usersData) {
        setUsers(usersData as UserProfile[]);
      }

      // Load plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (!plansError && plansData) {
        setPlans(plansData.map(p => ({
          ...p,
          features: (p.features as string[]) || []
        })));
      }
    };

    loadData();
  }, [isAdmin]);

  // Filter users
  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.slug?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update user subscription
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const statusValue = selectedUser.subscription_status as 'active' | 'inactive' | 'pending' | 'cancelled' | 'trial' | null;
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: statusValue,
          subscription_plan: selectedUser.subscription_plan,
          slug: selectedUser.slug,
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id ? selectedUser : u
      ));

      toast({
        title: 'Usuário atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });

      setIsUserModalOpen(false);
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o usuário.',
        variant: 'destructive',
      });
    }
  };

  // Create new user
  const handleCreateUser = async () => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserForm.email,
        password: newUserForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Usuário não criado');

      // Generate slug from name
      const slug = newUserForm.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Create profile
      const subscriptionStatus = newUserForm.subscription_status as 'active' | 'inactive' | 'pending' | 'cancelled' | 'trial';
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          email: newUserForm.email,
          name: newUserForm.name,
          slug: slug,
          must_change_password: true,
          subscription_status: subscriptionStatus,
        });

      if (profileError) throw profileError;

      // Add subscriber role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: 'subscriber',
        });

      if (roleError) throw roleError;

      toast({
        title: 'Usuário criado!',
        description: `${newUserForm.name} foi criado com sucesso. Senha temporária: ${newUserForm.password}`,
      });

      // Reload users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersData) {
        setUsers(usersData as UserProfile[]);
      }

      setIsCreateUserModalOpen(false);
      setNewUserForm({
        email: '',
        name: '',
        password: '',
        subscription_status: 'trial',
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o usuário.',
        variant: 'destructive',
      });
    }
  };

  // Update plan
  const handleUpdatePlan = async () => {
    if (!selectedPlan) return;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .update({
          name: selectedPlan.name,
          description: selectedPlan.description,
          price_monthly: selectedPlan.price_monthly,
          price_yearly: selectedPlan.price_yearly,
          is_active: selectedPlan.is_active,
          max_documents_per_month: selectedPlan.max_documents_per_month,
          max_patients: selectedPlan.max_patients,
        })
        .eq('id', selectedPlan.id);

      if (error) throw error;

      setPlans(prev => prev.map(p => 
        p.id === selectedPlan.id ? selectedPlan : p
      ));

      toast({
        title: 'Plano atualizado',
        description: 'As alterações foram salvas com sucesso.',
      });

      setIsPlanModalOpen(false);
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o plano.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string | null) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trial: 'secondary',
      inactive: 'destructive',
      pending: 'outline',
      cancelled: 'destructive',
    };

    const labels: Record<string, string> = {
      active: 'Ativo',
      trial: 'Trial',
      inactive: 'Inativo',
      pending: 'Pendente',
      cancelled: 'Cancelado',
    };

    return (
      <Badge variant={variants[status || 'inactive'] || 'outline'}>
        {labels[status || 'inactive'] || status}
      </Badge>
    );
  };

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/app')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                <h1 className="text-xl font-bold">Painel Admin</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {profile?.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 border-b border-border pb-4">
          <Button
            variant={view === 'users' ? 'default' : 'ghost'}
            onClick={() => setView('users')}
            className="gap-2"
          >
            <Users className="w-4 h-4" />
            Usuários
          </Button>
          <Button
            variant={view === 'plans' ? 'default' : 'ghost'}
            onClick={() => setView('plans')}
            className="gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Planos
          </Button>
          <Button
            variant={view === 'settings' ? 'default' : 'ghost'}
            onClick={() => setView('settings')}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            Configurações
          </Button>
        </div>

        {/* Users View */}
        {view === 'users' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setIsCreateUserModalOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Novo Usuário
              </Button>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.name || 'Sem nome'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.slug ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            /{user.slug}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.subscription_status)}
                      </TableCell>
                      <TableCell>
                        {user.subscription_plan || '—'}
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsUserModalOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredUsers.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum usuário encontrado
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              Total: {filteredUsers.length} usuário(s)
            </p>
          </div>
        )}

        {/* Plans View */}
        {view === 'plans' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-2xl p-6 bg-card ${
                  !plan.is_active ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </div>
                  {!plan.is_active && (
                    <Badge variant="outline">Inativo</Badge>
                  )}
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-black">
                    R$ {plan.price_monthly.toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedPlan(plan);
                    setIsPlanModalOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Plano
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Settings View */}
        {view === 'settings' && (
          <div className="max-w-2xl">
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Configurações do Sistema</h2>
              <p className="text-muted-foreground">
                Configurações avançadas estarão disponíveis em breve.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Nome</label>
                <p className="text-muted-foreground">{selectedUser.name || 'Sem nome'}</p>
              </div>

              <div>
                <label className="text-sm font-medium">Email</label>
                <p className="text-muted-foreground">{selectedUser.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Slug (URL personalizada)</label>
                <Input
                  value={selectedUser.slug || ''}
                  onChange={(e) => setSelectedUser({
                    ...selectedUser,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  })}
                  placeholder="nome-do-usuario"
                />
                <p className="text-xs text-muted-foreground">
                  URL: {window.location.origin}/{selectedUser.slug || 'slug'}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status da Assinatura</label>
                <Select
                  value={selectedUser.subscription_status || 'inactive'}
                  onValueChange={(value) => setSelectedUser({
                    ...selectedUser,
                    subscription_status: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Plano</label>
                <Select
                  value={selectedUser.subscription_plan || ''}
                  onValueChange={(value) => setSelectedUser({
                    ...selectedUser,
                    subscription_plan: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.name}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateUser}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Modal */}
      <Dialog open={isCreateUserModalOpen} onOpenChange={setIsCreateUserModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome Completo</label>
              <Input
                value={newUserForm.name}
                onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                placeholder="Nome do profissional"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Senha Temporária</label>
              <Input
                type="text"
                value={newUserForm.password}
                onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                placeholder="Senha de primeiro acesso"
              />
              <p className="text-xs text-muted-foreground">
                O usuário será obrigado a trocar a senha no primeiro login.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status Inicial</label>
              <Select
                value={newUserForm.subscription_status}
                onValueChange={(value: any) => setNewUserForm({ 
                  ...newUserForm, 
                  subscription_status: value 
                })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateUserModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateUser}>
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Modal */}
      <Dialog open={isPlanModalOpen} onOpenChange={setIsPlanModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Plano</DialogTitle>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome do Plano</label>
                <Input
                  value={selectedPlan.name}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Descrição</label>
                <Input
                  value={selectedPlan.description || ''}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preço Mensal (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={selectedPlan.price_monthly}
                    onChange={(e) => setSelectedPlan({ 
                      ...selectedPlan, 
                      price_monthly: parseFloat(e.target.value) || 0 
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Preço Anual (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={selectedPlan.price_yearly || ''}
                    onChange={(e) => setSelectedPlan({ 
                      ...selectedPlan, 
                      price_yearly: parseFloat(e.target.value) || null 
                    })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={selectedPlan.is_active}
                  onChange={(e) => setSelectedPlan({ 
                    ...selectedPlan, 
                    is_active: e.target.checked 
                  })}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm">
                  Plano ativo
                </label>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPlanModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdatePlan}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
