
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Driver {
  id: string;
  user_id: string;
  vehicle_model: string;
  vehicle_plate: string;
  vehicle_color: string;
  vehicle_year: number;
  price_per_km: number;
  rating: number;
  is_online: boolean;
  profile_photo_url?: string;
  car_photo_url?: string;
  users: {
    name: string;
    phone: string;
  };
}

export const useDrivers = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOnlineDrivers = async () => {
    try {
      console.log('Buscando motoristas online...');
      
      // Primeiro, vamos buscar todos os motoristas online
      const { data: driversData, error: driversError } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('is_online', true);

      if (driversError) {
        console.error('Erro ao buscar driver_profiles:', driversError);
        throw driversError;
      }

      console.log('Motoristas encontrados:', driversData);

      if (!driversData || driversData.length === 0) {
        console.log('Nenhum motorista online encontrado');
        setDrivers([]);
        return;
      }

      // Agora buscar os dados dos usuários correspondentes
      const userIds = driversData.map(driver => driver.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, phone')
        .in('id', userIds);

      if (usersError) {
        console.error('Erro ao buscar users:', usersError);
        throw usersError;
      }

      console.log('Dados dos usuários:', usersData);

      // Combinar os dados
      const combinedData = driversData.map(driver => {
        const user = usersData?.find(u => u.id === driver.user_id);
        return {
          ...driver,
          users: {
            name: user?.name || 'Nome não disponível',
            phone: user?.phone || ''
          }
        };
      });

      console.log('Dados combinados:', combinedData);
      setDrivers(combinedData);
    } catch (error) {
      console.error('Erro ao buscar motoristas:', error);
      toast.error('Erro ao carregar motoristas online');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineDrivers();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('driver-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'driver_profiles'
        },
        (payload) => {
          console.log('Atualização em tempo real:', payload);
          fetchOnlineDrivers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { drivers, loading, refetch: fetchOnlineDrivers };
};

export type { Driver };
