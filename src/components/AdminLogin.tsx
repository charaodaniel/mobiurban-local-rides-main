
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Shield, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

const AdminLogin = ({ onLoginSuccess }: AdminLoginProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [formData, setFormData] = useState({
    email: 'danielcharaomachado@hotmail.com',
    password: 'admin'
  });

  const createAdminUser = async () => {
    setCreatingAdmin(true);
    try {
      console.log('Tentando criar usuário admin...');
      
      // Primeiro, tentamos fazer signup do usuário admin
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/admin`,
          data: {
            name: 'Administrador'
          }
        }
      });

      if (signUpError) {
        // Se o erro é que o usuário já existe, tentamos fazer login
        if (signUpError.message.includes('already registered')) {
          console.log('Usuário já existe, tentando login...');
          return await handleLogin();
        }
        throw signUpError;
      }

      console.log('Usuário admin criado:', signUpData);
      
      // Se o signup foi bem-sucedido, fazemos login automaticamente
      if (signUpData.user && !signUpData.session) {
        // Usuário criado mas precisa confirmar email - vamos tentar login direto
        toast.success('Usuário admin criado! Fazendo login...');
        return await handleLogin();
      }

      if (signUpData.session) {
        // Login automático após signup
        await checkAdminStatus(signUpData.user.id);
        toast.success('Usuário admin criado e logado com sucesso!');
        onLoginSuccess();
      }

    } catch (error: any) {
      console.error('Erro ao criar usuário admin:', error);
      toast.error('Erro ao criar usuário admin: ' + error.message);
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleLogin = async () => {
    try {
      console.log('Tentando login com:', formData.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) {
        console.error('Erro no login:', error);
        throw error;
      }

      console.log('Login bem-sucedido:', data);

      // Verificar se o usuário é admin
      await checkAdminStatus(data.user.id);
      
      toast.success('Login realizado com sucesso!');
      onLoginSuccess();
    } catch (error: any) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const checkAdminStatus = async (userId: string) => {
    try {
      console.log('Verificando status de admin para usuário:', userId);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      console.log('Perfil encontrado:', profile);

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Erro ao buscar perfil:', profileError);
        throw profileError;
      }

      if (!profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        throw new Error('Acesso negado. Apenas administradores podem acessar este painel.');
      }
    } catch (error) {
      console.error('Erro ao verificar status de admin:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await handleLogin();
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast.error(error.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">
              Painel Administrativo
            </CardTitle>
            <CardDescription>
              Faça login para acessar o painel de administração
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12" 
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={createAdminUser}
                disabled={creatingAdmin}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {creatingAdmin ? 'Criando Admin...' : 'Criar Usuário Admin'}
              </Button>
            </div>

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
              <p>Email: danielcharaomachado@hotmail.com</p>
              <p>Senha: admin</p>
              <p className="mt-2 text-xs">
                Se não conseguir fazer login, clique em "Criar Usuário Admin" primeiro
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
