
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export const useAdminAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Sessão inicial:', session);
        
        if (session?.user) {
          setUser(session.user);
          await checkAdminStatus(session.user.id);
        }
      } catch (error) {
        console.error('Erro ao obter sessão inicial:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Mudança de autenticação:', event, session);
        
        if (session?.user) {
          setUser(session.user);
          await checkAdminStatus(session.user.id);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      console.log('Verificando status de admin para:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      console.log('Resultado da verificação de admin:', { data, error });

      if (!error && data?.role === 'admin') {
        console.log('Usuário é admin');
        setIsAdmin(true);
      } else {
        console.log('Usuário não é admin');
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Erro ao verificar status de admin:', error);
      setIsAdmin(false);
    }
  };

  const logout = async () => {
    console.log('Fazendo logout...');
    await supabase.auth.signOut();
    setUser(null);
    setIsAdmin(false);
  };

  return { user, isAdmin, loading, logout };
};
