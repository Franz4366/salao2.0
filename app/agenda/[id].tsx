import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';


export default function AgendamentoDetalhesScreen() {
  const { id } = useLocalSearchParams();
  const [agendamento, setAgendamento] = useState<any>(null);
  const agendamentoRef = useRef(null);

  useEffect(() => {
    if (id) {
      fetchAgendamento(id as string);
    }
  }, [id]);

  const fetchAgendamento = async (id: string) => {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('id, data, hora, comentario, clientes(nome), profissional:profiles(nome)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar agendamento:', error.message);
    } else {
      setAgendamento({
        ...data,
        cliente: data.clientes,
        profissional: data.profissional,
      });
    }
  };

 const compartilhar = async () => {
    try {
      const uri = await captureRef(agendamentoRef, {
        format: 'png',
        quality: 1,
      });

      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error("Erro ao compartilhar imagem:", error);
    }
  };

  if (!agendamento) return <Text>Carregando...</Text>;

  return (
    <View style={styles.container}>
      <View ref={agendamentoRef}>
        <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
        <Text style={styles.titulo}>Agendamento Confirmado!</Text>
        <View style={styles.containerAgendamento}>
        <Text style={styles.linha}><Text style={styles.label}>Cliente:</Text> {agendamento.cliente.nome}</Text>
        <Text style={styles.linha}><Text style={styles.label}>Profissional:</Text> {agendamento.profissional.nome}</Text>
        <Text style={styles.linha}><Text style={styles.label}>Data:</Text> {agendamento.data}</Text>
        <Text style={styles.linha}><Text style={styles.label}>Hora:</Text> {agendamento.hora}</Text>
        <Text style={styles.linha}><Text style={styles.label}>OBS:</Text> {agendamento.comentario}</Text>
      </View>
      </View>

      <TouchableOpacity style={styles.botao} onPress={compartilhar}>
        <MaterialIcons name="share" size={20} color="#fff" />
        <Text style={styles.botaoTexto}> Compartilhar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 60, 
    backgroundColor: '#f8a6ad',
    alignItems: 'center',
  },
  containerAgendamento: {  
    padding: 20, 
    backgroundColor: '#fff', 
    borderRadius: 10,
  },
  titulo: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 5,
    textAlign: 'center',
  },
  linha: { 
    fontSize: 18, 
    marginBottom: 10,
  },
  label: { 
    fontWeight: 'bold',
  },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgb(35, 213, 245)',
    borderRadius: 10,
    justifyContent: 'center',
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    alignSelf: 'center',  
  },
});
