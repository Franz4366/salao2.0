import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';

export default function TabLayout() {
  const [fontsLoaded] = useFonts({
    'sansation_bold': require('@/assets/fonts/sansation_bold.ttf'),
    'send_flowers_regular': require('@/assets/fonts/send_flowers_regular.ttf'),
  });

  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLogged(!!data.session);
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (!fontsLoaded) return null;

  if (loading) return null;

  if (!isLogged) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs screenOptions={{ headerShown: false }}>
    <Tabs.Screen
      name="home"
      options={{
        title: 'Home',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="home-outline" color={color} size={size} />
        ),
      }}
    />
    <Tabs.Screen
      name="agendamento"
      options={{
        title: 'Agendamentos',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="calendar-number-outline" color={color} size={size} />
        ),
      }}
    />
    <Tabs.Screen
      name="explore"
      options={{
        title: 'Explore',
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="compass-outline" color={color} size={size} />
        ),
      }}
    />
  </Tabs>
);
}