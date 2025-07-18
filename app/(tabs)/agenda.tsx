import { supabase } from '@/lib/supabase';
import { MaterialIcons } from '@expo/vector-icons';
import { RealtimeChannel } from '@supabase/supabase-js';
import dayjs from 'dayjs';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, ListRenderItem, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Agendamento = {
  id: string;
  profissional_id: string;
  profissional: {
    nome: string;
  }
  cliente_id: string;
  cliente: {
    nome: string;
  };
  comentario: string;
  data: string;
  hora: string;
  };
export default function AgendaScreen() {
  const hoje = dayjs();
  const [mesAtual, setMesAtual] = useState(hoje);
  const [diaSelecionado, setDiaSelecionado] = useState(hoje.format('YYYY-MM-DD'));
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
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
        console.log('Canal realtime removido com sucesso.');
      }
    };
  }, []);

  useEffect(() => {
  fetchAgendamentos();
}, [diaSelecionado]);

  const fetchAgendamentos = async () => {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('id, cliente_id, profissional_id, profissional:profiles( nome ), comentario, data, hora, clientes(nome)')
      .eq('data', diaSelecionado)
      .order('hora', { ascending: true });

    if (error) {
      console.error('Erro ao buscar agendamentos:', error.message);
      return;
    }

    const ajustado = data?.map((a: any) => ({
      ...a,
      cliente: a.clientes,
      profissional: a.profissional,
    }));

    setAgendamentos(ajustado);
  };

  useEffect(() => {
    const indexHoje = hoje.date() - 1;
    const larguraDia = 60;
    const offset = indexHoje * larguraDia;
    scrollRef.current?.scrollTo({ x: offset, animated: true });
  }, []);

  const selecionarDia = (dia: dayjs.Dayjs) => {
  const screenWidth = Dimensions.get('window').width;
  const larguraDia = 60;
  const margemItem = 10;
  const diaFormatado = dia.format('YYYY-MM-DD');
  const hojeFormatado = hoje.format('YYYY-MM-DD');

  const novoDiaSelecionado = diaFormatado === diaSelecionado
    ? hojeFormatado
    : diaFormatado;

  setDiaSelecionado(novoDiaSelecionado);

  const indexDia = parseInt(dayjs(novoDiaSelecionado).format('D'), 10) - 1;

  const itemTotal = larguraDia + margemItem;
  const offset = indexDia * itemTotal - (screenWidth / 2 - larguraDia / 2);
  const scrollX = offset < 0 ? 0 : offset;

  scrollRef.current?.scrollTo({ x: scrollX, animated: true });
};

  const gerarSemana = () => {
    const start = mesAtual.startOf('week').add(1, 'day');
    return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
  };

  const semanaDias = gerarSemana();
  const router = useRouter();

  const handleDelete = async (id: string) => {
  Alert.alert(
    "Excluir Agendamento",
    "Tem certeza que deseja excluir este agendamento?",
    [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from('agendamentos')
            .delete()
            .eq('id', id);

          if (error) {
            console.error('Erro ao excluir:', error.message);
          } else {
            fetchAgendamentos();
          }
        }
      }
    ]
  );
};

  const renderItem: ListRenderItem<Agendamento> = ({ item }) => (
<TouchableOpacity onPress={() => router.push({ pathname: '../agenda/[id]', params: { id: item.id } })}>
  <View style={styles.agendamento}>
    <View style={styles.agendamentoLinha}>
      <Text style={styles.hora}>{item.hora.slice(0, 5)}</Text>
      <View style={styles.agendamentoTextoContainer}>
        <Text style={styles.nomeCliente}>{item.cliente?.nome}</Text>
        <Text style={styles.profissional}>Prof: {item.profissional?.nome}</Text>
        <Text style={styles.comentario}>{item.comentario}</Text>
      </View>

      <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.botaoExcluir}>
          <MaterialIcons name="delete" size={24} color="#900" />
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

return (
  <View style={styles.container}>
    <View style={styles.headerCalendario}>
      <View style={styles.mesContainer}>
        <TouchableOpacity onPress={() => setMesAtual(mesAtual.subtract(1, 'month'))}>
          <Text style={styles.seta}>&lt;</Text>
        </TouchableOpacity>

        <Text style={styles.mesTexto}>
          {mesAtual.format('MMMM').replace(/^./, str => str.toUpperCase())}
        </Text>

        <TouchableOpacity onPress={() => setMesAtual(mesAtual.add(1, 'month'))}>
          <Text style={styles.seta}>&gt;</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.diasContainer}>
        <ScrollView
          horizontal
          ref={scrollRef}
          showsHorizontalScrollIndicator={false}
        >
          {Array.from({ length: mesAtual.daysInMonth() }, (_, i) => {
            const diaCompleto = mesAtual.date(i + 1);
            const diaFormatado = diaCompleto.format('YYYY-MM-DD');
            const isSelected = diaFormatado === diaSelecionado;
            const isToday = diaFormatado === hoje.format('YYYY-MM-DD');

            return (
              <TouchableOpacity
                key={diaFormatado}
                onPress={() => selecionarDia(diaCompleto)}
                style={styles.diaItem}
              >
                <Text style={styles.diaSemana}>
                  {diaCompleto.format('ddd').replace(/^./, s => s.toUpperCase())}
                </Text>
                <View
                  style={[
                    styles.diaNumeroContainer,
                    isSelected && styles.diaSelecionado,
                  ]}
                >
                  <Text
                    style={[
                      styles.diaNumero,
                      isSelected && styles.diaNumeroSelecionado,
                    ]}
                  >
                    {diaCompleto.date()}
                  </Text>
                </View>
                {isToday && <View style={styles.pontoVermelho} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>

    <View style={styles.agendamentosContainer}>
    <Text style={styles.tituloAgendamentos}>Agendamentos</Text>
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
  </View>
);
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCalendario: {
    backgroundColor: '#f8a6ad',
    height: 200,
    borderBottomLeftRadius: 80,
    borderBottomRightRadius: 80,
    paddingTop: 60,
    paddingBottom: 30,
  },
  mesContainer: {
     flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 80,
    marginBottom: 30,
  },
  seta: {
    fontSize: 20,
    color: 'black',
    fontWeight: 'bold',
  },
  mesTexto: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  diasContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  diaItem: {
    alignItems: 'center',
    marginHorizontal: 5,
    width: 60,
  },
  diaSemana: {
    fontSize: 16,
    color: 'black',
    marginBottom: 5,
  },
  diaNumeroContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  diaSelecionado: {
    backgroundColor: 'black',
    borderRadius: 17,
  },
  diaNumero: {
    fontSize: 14,
    color: 'black',
  },
  diaNumeroSelecionado: {
    color: '#f8a6ad',
    fontWeight: 'bold',
  },
  pontoVermelho: {
    width: 6,
    height: 6,
    backgroundColor: 'red',
    borderRadius: 3,
    marginTop: 2,
  },
  agendamento: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 2,
    backgroundColor: '#f8a6ad',
    marginBottom: 5,
    borderBottomColor: '#e1e1e1',
    width: '100%',
    borderRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    overflow: 'hidden',
  },
  agendamentoLinha: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginLeft: 10,
  },
  hora: {
     alignSelf: 'center',
    fontWeight: 'bold',
    width: 60,
    fontSize: 16,
    marginLeft: 10,
  },
  agendamentoTextoContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  nomeCliente: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profissional: {
    fontSize: 16,
    marginBottom: 5,
  },
  comentario: {
    fontSize: 16,
  },
  agendamentosContainer: {
    flex: 1,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  tituloAgendamentos: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scrollViewContainer: {
    flex: 1,
  },
  flatListContent: {
    paddingVertical: 10,
  },
  semAgendamentos: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  botaoExcluir: {
  padding: 10,
  borderRadius: 5,
  marginLeft: 10,
  justifyContent: 'center',
  alignItems: 'center',
  },
});
