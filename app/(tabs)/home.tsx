import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useFonts } from 'expo-font';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, ListRenderItem, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Cliente = {
  id: string;
  nome: string;
  data_nascimento: string;
};

type Agendamento = {
  id: string;
  cliente_id: string;
  cliente: {
    nome: string;
  };
  comentario: string;
  data: string;
  hora: string;
};

export default function home() {
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [fotoUsuario, setFotoUsuario] = useState('');
  const [aniversariantes, setAniversariantes] = useState<Cliente[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [fontsLoaded] = useFonts({
    'sansation_bold': require('@/assets/fonts/sansation_bold.ttf'),
    'send_flowers_regular': require('@/assets/fonts/send_flowers_regular.ttf'),
  });

  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    fetchPerfil();
    fetchAniversariantes();
    fetchAgendamentos();

    const initRealtime = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await fetchAgendamentos();

      const channel = supabase
        .channel('realtime-agendamentos')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'agendamentos',
            filter: `profissional_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Alteração recebida:', payload);
            fetchAgendamentos();
          }
        );

      try {
        await channel.subscribe();
        console.log('Canal realtime inscrito com sucesso.');
        channelRef.current = channel;
      } catch (err) {
        console.error('Erro ao se inscrever no canal realtime:', err);
      }
    };

    initRealtime();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        console.log('Canal realtime removido.');
      }
    };
  }, []);

  const fetchPerfil = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('nome, photo_url')
        .eq('id', user.id)
        .single();

      if (data) {
        setNomeUsuario(data.nome);
        setFotoUsuario(data.photo_url);
      } else {
        console.error('Erro ao buscar perfil:', error?.message);
      }
    }
  };

  const fetchAniversariantes = async () => {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const padrao = `%-${mes}-${dia}`;

    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome, data_nascimento')
      .like('data_nascimento', padrao);

    if (data) {
      setAniversariantes(data);
    } else {
      console.error('Erro ao buscar aniversariantes:', error?.message);
    }
  };

  const fetchAgendamentos = async () => {
    const hoje = new Date().toISOString().split('T')[0];
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('agendamentos')
        .select('id, cliente_id, comentario, data, hora, clientes(nome)')
        .eq('profissional_id', user.id)
        .eq('data', hoje)
        .order('hora', { ascending: true });

      if (data) {
        const ajustado = data.map((a: any) => ({
          ...a,
          cliente: a.clientes,
        }));
        setAgendamentos(ajustado);
      } else {
        console.error('Erro ao buscar agendamentos:', error?.message);
      }
    }
  };

  const renderItem: ListRenderItem<Agendamento> = ({ item }) => (
    <View style={styles.agendamento}>
      <View style={styles.agendamentoLinha}>
        <Text style={styles.hora}>{item.hora.slice(0, 5)}</Text>
        <View style={styles.agendamentoTextoContainer}>
          <Text style={styles.nomeCliente}>{item.cliente?.nome}</Text>
          <Text style={styles.comentario}>{item.comentario}</Text>
        </View>
      </View>
    </View>
  );

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Cabeçalho */}
      <View style={styles.rectangle_33} />
      <View style={styles.header}>
        <Text style={styles.oi}>Oi,</Text>
        <Text style={styles.nome}>{nomeUsuario || 'Usuário'}</Text>
        {fotoUsuario ? (
          <Image source={{ uri: fotoUsuario }} style={styles.avatar} />
        ) : (
          <Image source={require('@/assets/images/girl.png')} style={styles.avatar} />
        )}
      </View>

      {/* Aniversariantes */}
      <View style={styles.aniversariantesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 15 }}>
          {aniversariantes.length === 0 ? (
            <View key="sem-aniversariante" style={[styles.cardSemAniversariante]}>
              <Text>Nenhum aniversariante hoje.</Text>
            </View>
          ) : (
            aniversariantes.map((cliente) => {
              const cor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
              return (
                <View key={cliente.id} style={[styles.cardAniversario, { backgroundColor: cor }]}>
                  <View style={styles.cardTopo}>
                    <Text style={styles.cardTexto}>
                      {`Hoje é o aniversário de ${cliente.nome}!`}
                    </Text>
                    <TouchableOpacity style={styles.cardBotao}>
                      <Text style={styles.cardBotaoTexto}>Enviar mensagem</Text>
                    </TouchableOpacity>
                  </View>
                  <Image style={styles.cardImage} source={require('@/assets/images/girl.png')} />
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Agendamentos */}
      <Text style={styles.tituloAgendamentos}>Seus Agendamentos de Hoje</Text>
      <ScrollView style={styles.scrollViewContainer}>
        <View style={styles.agendamentosContainer}>
          {agendamentos.length === 0 ? (
            <Text style={styles.semAgendamentos}>Nenhum agendamento para hoje.</Text>
          ) : (
            <FlatList
              data={agendamentos}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.flatListContent}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollViewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  aniversariantesContainer: {
    marginTop: 100,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 65,
  },
  avatar: {
    width: 70,
    height: 70,
    position: 'absolute',
    right: 20,
    top: 10,
    borderRadius: 35,
  },
  oi: {
    color: 'rgba(0, 0, 0, 0.57)',
    fontSize: 30,
    fontFamily: 'send_flowers_regular',
    position: 'absolute',
    marginLeft: 20,
    marginTop: 40,
  },
  nome: {
    position: 'absolute',
    marginLeft: 65,
    marginTop: 90,
    color: 'rgba(0, 0, 0, 0.57)',
    fontSize: 30,
    fontFamily: 'send_flowers_regular',
  },
  cardAniversario: {
    padding: 15,
    borderRadius: 30,
    marginRight: 10,
    width: 340,
    height: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
  },
  cardSemAniversariante: {
    backgroundColor: '#e1e1e1',
    borderRadius: 30,
    width: 340,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTopo: {
    flex: 1,
    justifyContent: 'space-between',
    height: '100%',
  },
  cardTexto: {
    fontSize: 18,
    fontFamily: 'sansation_bold',
    color: '#333',
    marginBottom: 10,
    maxWidth: 200,
  },
  cardImage: {
    width: 120,
    height: 140,
    resizeMode: 'contain',
    marginLeft: 10,
  },
  cardBotao: {
    backgroundColor: '#FFD3D3',
    paddingVertical: 8,
    paddingHorizontal: 10,
    maxWidth: 140,
    marginLeft: 20,
    borderRadius: 10,
  },
  cardBotaoTexto: {
    color: '#B38CB4',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tituloAgendamentos: {
    color: 'rgba(0, 0, 0, 0.71)',
    fontSize: 20,
    fontFamily: 'sansation_bold',
    marginLeft: 4,
  },
  agendamentosContainer: {
    paddingHorizontal: 20,
    flex: 1,
    marginTop: 20,
  },
  agendamento: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  agendamentoLinha: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hora: {
    alignSelf: 'center',
    fontWeight: 'bold',
    width: 60,
    fontSize: 16,
  },
  agendamentoTextoContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  nomeCliente: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 2,
  },
  comentario: {
    fontSize: 14,
    color: '#555',
  },
  semAgendamentos: {
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    color: '#888',
  },
  flatListContent: {
    paddingBottom: 20,
  },
  rectangle_33: {
    width: 450,
    height: 390,
    position: 'absolute',
    left: -200,
    top: -200,
    backgroundColor: '#f8a6ad',
    borderRadius: 80,
  },
});
