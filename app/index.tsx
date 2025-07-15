import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace('/(tabs)/home');
      } else {
        router.replace('/(auth)/login');
      }
    };
    checkSession();
  }, []);

  return null;
}
