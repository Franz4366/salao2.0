import { supabase } from '@/lib/supabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
dayjs.locale('pt-br');

type Cliente = {
  id: string;
  nome: string;
};

export default function AgendamentoScreen() {
  const hoje = dayjs();
  const [mesAtual, setMesAtual] = useState(hoje);
  const [diaSelecionado, setDiaSelecionado] = useState(hoje.format('YYYY-MM-DD'));
  const [busca, setBusca] = useState('');
  const [sugestoes, setSugestoes] = useState<Cliente[]>([]);
  const [comentario, setComentario] = useState('');
  const [mostrarRelogio, setMostrarRelogio] = useState(false);
  const [dataHoraSelecionada, setDataHoraSelecionada] = useState(new Date());
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [profissionalSelecionado, setProfissionalSelecionado] = useState<string | null>(null);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

const scrollRef = useRef<ScrollView>(null);

useEffect(() => {
  const indexHoje = hoje.date() - 1;
  const larguraDia = 60;
  const offset = indexHoje * larguraDia;
  scrollRef.current?.scrollTo({ x: offset, animated: true });}, []);

useEffect(() => {
  const carregarProfissionais = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nome, photo_url');

    if (error) {
      console.error('Erro ao carregar profissionais:', error.message);
    } else {
      setProfissionais(data || []);
    }
  };

  carregarProfissionais();
}, []);
  const buscarClientes = async (texto: string) => {
    setBusca(texto);

    if (texto.length < 2) {
      setSugestoes([]);
      return;
    }

    const { data, error } = await supabase
      .from('clientes')
      .select('id, nome')
      .ilike('nome', `${texto}%`);

    if (error) {
      console.error('Erro ao buscar clientes:', error.message);
      return;
    }

    setSugestoes(data || []);
  };

  const gerarSemana = () => {
    const start = mesAtual.startOf('week').add(1, 'day');
    return Array.from({ length: 7 }, (_, i) => start.add(i, 'day'));
  };

  const semanaDias = gerarSemana();

  const selecionarDia = (dia: Dayjs) => {
    const diaFormatado = dia.format('YYYY-MM-DD');
    if (diaFormatado === diaSelecionado) {
      setDiaSelecionado(hoje.format('YYYY-MM-DD'));
    } else {
      setDiaSelecionado(diaFormatado);
    }
    };

 const agendar = async () => {
  const horaSelecionada = dayjs(dataHoraSelecionada).format('HH:mm');
  const dataSelecionada = diaSelecionado;

  if (!clienteSelecionado) {
    alert('Por favor, selecione um cliente.');
    return;
  }

  if (!dataSelecionada) {
    alert('Por favor, selecione uma data.');
    return;
  }

  if (!horaSelecionada) {
    alert('Por favor, selecione uma hora.');
    return;
  }

  if (!profissionalSelecionado) {
    alert('Por favor, selecione um profissional.');
    return;
  }

  const { error } = await supabase.from('agendamentos').insert({
    cliente_id: clienteSelecionado.id,
    data: dataSelecionada,
    hora: horaSelecionada,
    comentario: comentario,
    profissional_id: profissionalSelecionado,
  });

  if (error) {
    alert('Erro ao agendar: ' + error.message);
  } else {
    alert('Agendamento realizado com sucesso!');
    setBusca('');
    setClienteSelecionado(null);
    setComentario('');
    setProfissionalSelecionado(null);
  }
};

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

    <TextInput
      style={styles.input}
      placeholder="Buscar cliente..."
      value={busca}
      onChangeText={buscarClientes}
    />

    {sugestoes.length > 0 && (
      <FlatList
        data={sugestoes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setBusca(item.nome);
              setClienteSelecionado(item);
              setSugestoes([]);
            }}
            style={styles.itemSugestao}
          >
            <Text style={styles.nomeCliente}>{item.nome}</Text>
          </TouchableOpacity>
        )}
        style={styles.listaSugestoes}
      />
    )}

    <View style={{ marginHorizontal: 20, marginTop: 2 }}>
      <TextInput
        style={styles.campoComentario}
        placeholder="Digite os comentários..."
        value={comentario}
        onChangeText={setComentario}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />
    </View>
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.profissionaisContainer}
>
  {profissionais.map((prof) => (
    <TouchableOpacity
      key={prof.id}
      style={[
        styles.profissionalItem,
        profissionalSelecionado === prof.id && styles.profissionalSelecionado,
      ]}
      onPress={() => setProfissionalSelecionado(prof.id)}
    >
      <Image
        source={{ uri: prof.photo_url}}
        style={styles.fotoProfissional}
      />
      <Text style={styles.nomeProfissional}>{prof.nome}</Text>
    </TouchableOpacity>
  ))}
</ScrollView>

  <TouchableOpacity
    style={styles.botaoRelogio}
    onPress={() => setMostrarRelogio(true)}
  >
    <Text style={styles.botaoRelogioTexto}>
      {dayjs(dataHoraSelecionada).format('HH:mm')}
    </Text>
  </TouchableOpacity>

  {mostrarRelogio && (
    <DateTimePicker
      value={dataHoraSelecionada}
      mode="time"
      is24Hour={true}
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={(event, selectedDate) => {
        setMostrarRelogio(false);
        if (selectedDate) {
          setDataHoraSelecionada(selectedDate);
        }
      }}
    />
  )}

    <TouchableOpacity
      style={styles.botaoAgendar}
      onPress={agendar}
    >
      <Text style={styles.botaoAgendarTexto}>Agendar</Text>
    </TouchableOpacity>
  </View>
);
};


const styles = StyleSheet.create({
  container: { flex: 1 },
  input: {
    margin: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    fontSize: 16,
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
    paddingHorizontal: 20,
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
    marginBottom: 20,
  },
  agendamentoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agendamentoTextoContainer: {
    flex: 1,
  },
  nomeCliente: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemSugestao: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  listaSugestoes: {
    maxHeight: 200,
    borderWidth: 1,
    marginHorizontal: 20,
    borderColor: '#ccc',
    borderRadius: 8,
  },
  campoComentario: {
    borderWidth: 1,
    height: 150,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 16,
  },
  profissionaisContainer: {
    flexDirection: 'row',
    paddingHorizontal: 5,
    marginBottom: 20,
    marginTop: 15,
    justifyContent: 'center',
  },
  profissionalItem: {
    alignItems: 'center',
    marginRight: 10,
    padding: 15,
    borderRadius: 10,
  },
  profissionalNome: {
    fontSize: 14,
    color: 'black',
    marginTop: 5,
  },
  profissionalSelecionado: {
    backgroundColor: 'rgba(248, 166, 173, 0.51)',
    borderRadius: 20,
  },
  nomeProfissional: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  fotoProfissional: {
    width: 70,
    height: 70,
    borderRadius: 40,
    marginBottom: 5,
  },
  botaoRelogio: {
    width: '50%',
    alignSelf: 'center',
    backgroundColor: '#f8a6ad',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  botaoRelogioTexto: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
  },
  botaoAgendar: {
    backgroundColor: '#f8a6ad',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 5,
  },
  botaoAgendarTexto: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
