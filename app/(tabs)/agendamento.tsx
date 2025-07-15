import { supabase } from '@/lib/supabase';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

  return (
    <View style={styles.container}>
      <View style={styles.headerCalendario}>
        <View style={styles.mesContainer}>
          <TouchableOpacity onPress={() => setMesAtual(mesAtual.subtract(1, 'month'))}>
            <Text style={styles.seta}>&lt;</Text>
          </TouchableOpacity>
          <Text style={styles.mesTexto}>{mesAtual.format('MMMM YYYY')}</Text>
          <TouchableOpacity onPress={() => setMesAtual(mesAtual.add(1, 'month'))}>
            <Text style={styles.seta}>&gt;</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.diasContainer}>
          {semanaDias.map((diaCompleto) => {
  const diaFormatado = diaCompleto.format('YYYY-MM-DD');
  const isSelected = diaFormatado === diaSelecionado;
  const isToday = diaFormatado === hoje.format('YYYY-MM-DD');

  return (
    <TouchableOpacity
      key={diaFormatado}
      onPress={() => selecionarDia(diaCompleto)}
      style={styles.diaItem}
    >
      <Text style={styles.diaSemana}>{diaCompleto.format('ddd')}</Text>
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
    </View>
  );
}

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
  height: 200,
  borderColor: '#ccc',
  borderRadius: 8,
  fontSize: 16,
  },
});
