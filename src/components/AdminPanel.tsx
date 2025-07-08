
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Shield, ShieldOff, Users, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AdminLogin from "./AdminLogin";
import { useAdminAuth } from "@/hooks/useAdminAuth";

interface Driver {
  id: string;
  user_id: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string;
  vehicle_year: number;
  price_per_km: number;
  is_online: boolean;
  rating: number;
  profile_photo_url?: string;
  car_photo_url?: string;
  users?: {
    name: string;
    email: string;
    phone: string;
  };
}

const AdminPanel = () => {
  const { user, isAdmin, loading, logout } = useAdminAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicle_model: '',
    vehicle_plate: '',
    vehicle_color: '',
    vehicle_year: new Date().getFullYear(),
    price_per_km: 2.50,
  });

  useEffect(() => {
    if (isAdmin) {
      fetchDrivers();
    }
  }, [isAdmin]);

  const fetchDrivers = async () => {
    try {
      console.log('Buscando motoristas...');
      const { data, error } = await supabase
        .from('driver_profiles')
        .select(`
          *,
          users (
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar motoristas:', error);
        throw error;
      }
      
      console.log('Motoristas encontrados:', data);
      setDrivers(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar motoristas:', error);
      toast.error('Erro ao carregar motoristas: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setDriversLoading(false);
    }
  };

  const handleCreateDriver = async () => {
    try {
      console.log('Criando novo motorista:', formData);
      
      // First create user
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: 'driver'
        }])
        .select()
        .single();

      if (userError) {
        console.error('Erro ao criar usuário:', userError);
        throw userError;
      }

      console.log('Usuário criado:', userData);

      // Then create driver profile
      const { error: driverError } = await supabase
        .from('driver_profiles')
        .insert([{
          user_id: userData.id,
          vehicle_model: formData.vehicle_model,
          vehicle_plate: formData.vehicle_plate,
          vehicle_color: formData.vehicle_color,
          vehicle_year: formData.vehicle_year,
          price_per_km: formData.price_per_km,
        }]);

      if (driverError) {
        console.error('Erro ao criar perfil do motorista:', driverError);
        throw driverError;
      }

      toast.success('Motorista criado com sucesso!');
      setDialogOpen(false);
      resetForm();
      fetchDrivers();
    } catch (error: any) {
      console.error('Erro ao criar motorista:', error);
      toast.error(error.message || 'Erro ao criar motorista');
    }
  };

  const handleUpdateDriver = async () => {
    if (!editingDriver) return;

    try {
      console.log('Atualizando motorista:', editingDriver.id, formData);
      
      // Update user data
      const { error: userError } = await supabase
        .from('users')
        .update({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        })
        .eq('id', editingDriver.user_id);

      if (userError) {
        console.error('Erro ao atualizar usuário:', userError);
        throw userError;
      }

      // Update driver profile
      const { error: driverError } = await supabase
        .from('driver_profiles')
        .update({
          vehicle_model: formData.vehicle_model,
          vehicle_plate: formData.vehicle_plate,
          vehicle_color: formData.vehicle_color,
          vehicle_year: formData.vehicle_year,
          price_per_km: formData.price_per_km,
        })
        .eq('id', editingDriver.id);

      if (driverError) {
        console.error('Erro ao atualizar perfil do motorista:', driverError);
        throw driverError;
      }

      toast.success('Motorista atualizado com sucesso!');
      setDialogOpen(false);
      setEditingDriver(null);
      resetForm();
      fetchDrivers();
    } catch (error: any) {
      console.error('Erro ao atualizar motorista:', error);
      toast.error(error.message || 'Erro ao atualizar motorista');
    }
  };

  const handleDeleteDriver = async (driverId: string, userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este motorista?')) return;

    try {
      console.log('Excluindo motorista:', driverId, userId);
      
      // Delete driver profile first (due to foreign key)
      const { error: driverError } = await supabase
        .from('driver_profiles')
        .delete()
        .eq('id', driverId);

      if (driverError) {
        console.error('Erro ao excluir perfil do motorista:', driverError);
        throw driverError;
      }

      // Delete user
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (userError) {
        console.error('Erro ao excluir usuário:', userError);
        throw userError;
      }

      toast.success('Motorista excluído com sucesso!');
      fetchDrivers();
    } catch (error: any) {
      console.error('Erro ao excluir motorista:', error);
      toast.error(error.message || 'Erro ao excluir motorista');
    }
  };

  const toggleDriverStatus = async (driverId: string, currentStatus: boolean) => {
    try {
      console.log('Alterando status do motorista:', driverId, 'para:', !currentStatus);
      
      const { error } = await supabase
        .from('driver_profiles')
        .update({ is_online: !currentStatus })
        .eq('id', driverId);

      if (error) {
        console.error('Erro ao alterar status:', error);
        throw error;
      }

      toast.success(`Motorista ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
      fetchDrivers();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do motorista: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      vehicle_model: '',
      vehicle_plate: '',
      vehicle_color: '',
      vehicle_year: new Date().getFullYear(),
      price_per_km: 2.50,
    });
  };

  const openEditDialog = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.users?.name || '',
      email: driver.users?.email || '',
      phone: driver.users?.phone || '',
      vehicle_model: driver.vehicle_model,
      vehicle_plate: driver.vehicle_plate,
      vehicle_color: driver.vehicle_color,
      vehicle_year: driver.vehicle_year,
      price_per_km: driver.price_per_km,
    });
    setDialogOpen(true);
  };

  const handleLoginSuccess = () => {
    // O hook useAdminAuth já cuida da atualização do estado
    console.log('Login de admin realizado com sucesso');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold">Painel Administrativo</h1>
              <p className="text-gray-600 dark:text-gray-300">Gerenciar motoristas do sistema</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setEditingDriver(null); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Motorista
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingDriver ? 'Editar Motorista' : 'Novo Motorista'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingDriver 
                      ? 'Atualize as informações do motorista' 
                      : 'Preencha os dados para cadastrar um novo motorista'
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                      placeholder="Nome completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_model">Modelo do Veículo</Label>
                    <Input
                      id="vehicle_model"
                      value={formData.vehicle_model}
                      onChange={(e) => setFormData(prev => ({...prev, vehicle_model: e.target.value}))}
                      placeholder="Ex: Honda Civic"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_plate">Placa</Label>
                    <Input
                      id="vehicle_plate"
                      value={formData.vehicle_plate}
                      onChange={(e) => setFormData(prev => ({...prev, vehicle_plate: e.target.value.toUpperCase()}))}
                      placeholder="ABC-1234"
                      maxLength={8}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_color">Cor</Label>
                    <Input
                      id="vehicle_color"
                      value={formData.vehicle_color}
                      onChange={(e) => setFormData(prev => ({...prev, vehicle_color: e.target.value}))}
                      placeholder="Ex: Branco"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_year">Ano</Label>
                    <Input
                      id="vehicle_year"
                      type="number"
                      value={formData.vehicle_year}
                      onChange={(e) => setFormData(prev => ({...prev, vehicle_year: parseInt(e.target.value)}))}
                      min="2000"
                      max={new Date().getFullYear() + 1}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="price_per_km">Preço por KM (R$)</Label>
                    <Input
                      id="price_per_km"
                      type="number"
                      step="0.10"
                      min="1.00"
                      max="10.00"
                      value={formData.price_per_km}
                      onChange={(e) => setFormData(prev => ({...prev, price_per_km: parseFloat(e.target.value)}))}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={editingDriver ? handleUpdateDriver : handleCreateDriver}>
                    {editingDriver ? 'Atualizar' : 'Criar'} Motorista
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Motoristas</p>
                  <p className="text-2xl font-bold">{drivers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Online</p>
                  <p className="text-2xl font-bold">{drivers.filter(d => d.is_online).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShieldOff className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Offline</p>
                  <p className="text-2xl font-bold">{drivers.filter(d => !d.is_online).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Drivers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Motoristas Cadastrados</CardTitle>
            <CardDescription>
              Gerencie todos os motoristas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {driversLoading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : drivers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Nenhum motorista cadastrado ainda.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Placa</TableHead>
                    <TableHead>Preço/km</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Avaliação</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {driver.profile_photo_url && (
                            <img
                              src={driver.profile_photo_url}
                              alt="Foto"
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium">{driver.users?.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{driver.users?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{driver.vehicle_model}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{driver.vehicle_color} - {driver.vehicle_year}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{driver.vehicle_plate}</TableCell>
                      <TableCell className="text-green-600 font-medium">
                        R$ {driver.price_per_km.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={driver.is_online ? "default" : "secondary"}>
                          {driver.is_online ? 'Online' : 'Offline'}
                        </Badge>
                      </TableCell>
                      <TableCell>⭐ {driver.rating?.toFixed(1) || '5.0'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(driver)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleDriverStatus(driver.id, driver.is_online)}
                          >
                            {driver.is_online ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDriver(driver.id, driver.user_id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
