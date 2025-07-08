
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Settings, MessageCircle, User, Car, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthState } from "@/hooks/useAuthState";
import { toast } from "sonner";
import { ThemeToggle } from "./ThemeToggle";
import ImageUpload from "./ImageUpload";

interface DriverProfile {
  id: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string;
  vehicle_year: number;
  price_per_km: number;
  is_online: boolean;
  rating: number;
  profile_photo_url?: string;
  car_photo_url?: string;
}

const DriverDashboard = () => {
  const { user } = useAuthState();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    vehicle_model: '',
    vehicle_plate: '',
    vehicle_color: '',
    vehicle_year: new Date().getFullYear(),
    price_per_km: 2.50,
    profile_photo_url: '',
    car_photo_url: ''
  });

  useEffect(() => {
    if (user) {
      console.log('Usuário logado:', user);
      fetchDriverProfile();
    }
  }, [user]);

  const fetchDriverProfile = async () => {
    if (!user?.id) {
      console.log('Usuário não encontrado');
      setLoading(false);
      return;
    }

    try {
      console.log('Buscando perfil do motorista para usuário:', user.id);
      
      const { data, error } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Resultado da busca:', { data, error });

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', error);
        throw error;
      }
      
      if (data) {
        console.log('Perfil encontrado:', data);
        setProfile(data);
        setEditData({
          vehicle_model: data.vehicle_model,
          vehicle_plate: data.vehicle_plate,
          vehicle_color: data.vehicle_color,
          vehicle_year: data.vehicle_year,
          price_per_km: data.price_per_km,
          profile_photo_url: data.profile_photo_url || '',
          car_photo_url: data.car_photo_url || ''
        });
      } else {
        console.log('Nenhum perfil encontrado para o usuário');
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      toast.error('Erro ao carregar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOnline = async (isOnline: boolean) => {
    if (!profile) {
      toast.error('Complete seu perfil primeiro');
      return;
    }

    try {
      console.log('Alterando status online para:', isOnline);
      
      const { error } = await supabase
        .from('driver_profiles')
        .update({ is_online: isOnline })
        .eq('id', profile.id);

      if (error) {
        console.error('Erro ao atualizar status:', error);
        throw error;
      }
      
      setProfile(prev => prev ? { ...prev, is_online: isOnline } : null);
      toast.success(isOnline ? 'Você está online!' : 'Você está offline');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      toast.error('Usuário não encontrado');
      return;
    }

    setSaving(true);
    
    try {
      console.log('Salvando perfil:', editData);
      
      const profileData = {
        user_id: user.id,
        vehicle_model: editData.vehicle_model,
        vehicle_plate: editData.vehicle_plate,
        vehicle_color: editData.vehicle_color,
        vehicle_year: editData.vehicle_year,
        price_per_km: editData.price_per_km,
        profile_photo_url: editData.profile_photo_url,
        car_photo_url: editData.car_photo_url,
        updated_at: new Date().toISOString()
      };

      console.log('Dados que serão salvos:', profileData);

      if (profile) {
        // Atualizar perfil existente
        console.log('Atualizando perfil existente, ID:', profile.id);
        
        const { data, error } = await supabase
          .from('driver_profiles')
          .update(profileData)
          .eq('id', profile.id)
          .select()
          .single();

        if (error) {
          console.error('Erro ao atualizar perfil:', error);
          throw error;
        }
        
        console.log('Perfil atualizado com sucesso:', data);
        setProfile(data);
      } else {
        // Criar novo perfil
        console.log('Criando novo perfil');
        
        const { data, error } = await supabase
          .from('driver_profiles')
          .insert([profileData])
          .select()
          .single();

        if (error) {
          console.error('Erro ao criar perfil:', error);
          throw error;
        }
        
        console.log('Perfil criado com sucesso:', data);
        setProfile(data);
      }

      toast.success('Perfil salvo com sucesso!');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar perfil: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (type: 'profile' | 'car', url: string) => {
    console.log('Imagem carregada:', type, url);
    if (type === 'profile') {
      setEditData(prev => ({ ...prev, profile_photo_url: url }));
    } else {
      setEditData(prev => ({ ...prev, car_photo_url: url }));
    }
  };

  const handleLogout = async () => {
    console.log('Fazendo logout...');
    await supabase.auth.signOut();
    toast.success('Logout realizado com sucesso!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.profile_photo_url || user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white">
                {user?.user_metadata?.name?.substring(0, 2).toUpperCase() || 'M'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold dark:text-white">Dashboard Motorista</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {user?.user_metadata?.name || user?.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Status Card */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 dark:text-white">
                  Status Online
                  <Badge variant={profile?.is_online ? "default" : "secondary"}>
                    {profile?.is_online ? 'Online' : 'Offline'}
                  </Badge>
                </CardTitle>
                <CardDescription className="dark:text-gray-300">
                  Controle sua disponibilidade para receber corridas
                </CardDescription>
              </div>
              <Switch
                checked={profile?.is_online || false}
                onCheckedChange={handleToggleOnline}
                disabled={!profile}
              />
            </div>
          </CardHeader>
        </Card>

        {/* Photo Upload Cards */}
        {isEditing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ImageUpload
              currentImageUrl={editData.profile_photo_url}
              onImageUploaded={(url) => handleImageUpload('profile', url)}
              type="profile"
              userId={user?.id || ''}
            />
            <ImageUpload
              currentImageUrl={editData.car_photo_url}
              onImageUploaded={(url) => handleImageUpload('car', url)}
              type="car"
              userId={user?.id || ''}
            />
          </div>
        )}

        {/* Profile Card */}
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Car className="h-5 w-5" />
                Informações do Veículo
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Mantenha seus dados atualizados
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              disabled={saving}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? 'Cancelar' : 'Editar'}
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_model">Modelo do Veículo</Label>
                    <Input
                      id="vehicle_model"
                      value={editData.vehicle_model}
                      onChange={(e) => setEditData(prev => ({...prev, vehicle_model: e.target.value}))}
                      placeholder="Ex: Civic, Corolla"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_year">Ano</Label>
                    <Input
                      id="vehicle_year"
                      type="number"
                      value={editData.vehicle_year}
                      onChange={(e) => setEditData(prev => ({...prev, vehicle_year: parseInt(e.target.value) || 2020}))}
                      min="2000"
                      max={new Date().getFullYear() + 1}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_color">Cor</Label>
                    <Input
                      id="vehicle_color"
                      value={editData.vehicle_color}
                      onChange={(e) => setEditData(prev => ({...prev, vehicle_color: e.target.value}))}
                      placeholder="Ex: Branco, Prata"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vehicle_plate">Placa</Label>
                    <Input
                      id="vehicle_plate"
                      value={editData.vehicle_plate}
                      onChange={(e) => setEditData(prev => ({...prev, vehicle_plate: e.target.value.toUpperCase()}))}
                      placeholder="ABC-1234"
                      maxLength={8}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_per_km">Preço por KM (R$)</Label>
                  <Input
                    id="price_per_km"
                    type="number"
                    step="0.10"
                    min="1.00"
                    max="10.00"
                    value={editData.price_per_km}
                    onChange={(e) => setEditData(prev => ({...prev, price_per_km: parseFloat(e.target.value) || 2.50}))}
                    required
                  />
                </div>

                <Button 
                  onClick={handleSaveProfile} 
                  className="w-full"
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar Informações'}
                </Button>
              </>
            ) : profile ? (
              <>
                {(profile.profile_photo_url || profile.car_photo_url) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {profile.profile_photo_url && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Foto de Perfil</p>
                        <img
                          src={profile.profile_photo_url}
                          alt="Foto de perfil"
                          className="w-32 h-32 rounded-full object-cover mx-auto border-2 border-gray-200"
                        />
                      </div>
                    )}
                    {profile.car_photo_url && (
                      <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Foto do Carro</p>
                        <img
                          src={profile.car_photo_url}
                          alt="Foto do carro"
                          className="w-full h-48 rounded-lg object-cover border-2 border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Modelo</p>
                    <p className="font-medium dark:text-white">{profile.vehicle_model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Ano</p>
                    <p className="font-medium dark:text-white">{profile.vehicle_year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Cor</p>
                    <p className="font-medium dark:text-white">{profile.vehicle_color}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Placa</p>
                    <p className="font-medium font-mono dark:text-white">{profile.vehicle_plate}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Preço/km</p>
                    <p className="font-medium text-green-600">R$ {profile.price_per_km.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Avaliação</p>
                    <p className="font-medium dark:text-white">⭐ {profile.rating.toFixed(1)}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Car className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Complete seu perfil para começar a receber corridas
                </p>
                <Button onClick={() => setIsEditing(true)}>
                  Completar Perfil
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold dark:text-white">0</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Conversas Hoje</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardContent className="p-6 text-center">
              <User className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <p className="text-2xl font-bold dark:text-white">0</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Corridas Realizadas</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur">
            <CardContent className="p-6 text-center">
              <Settings className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <p className="text-2xl font-bold dark:text-white">{profile?.rating?.toFixed(1) || '5.0'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Sua Avaliação</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
