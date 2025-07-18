import { supabase } from '@/lib/supabase';
import React, { useEffect, useState } from 'react';
import { FlatList, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';


type Cliente = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string;
};

export default function CadastroCliente() {
  const [nome, setNome] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');

  useEffect(() => {
    const fetchClientes = async () => {
      if (nome.length < 2) {
        setClientesFiltrados([]);
        return;
      }

      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .ilike('nome', `%${nome}%`);

      if (!error && data) {
        setClientesFiltrados(data);
      }
    };

    fetchClientes();
  }, [nome]);

  const handleSelectCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setNome(cliente.nome);
    setEmail(cliente.email);
    setTelefone(cliente.telefone);
    setDataNascimento(formatarData(cliente.data_nascimento));
    setClientesFiltrados([]);
  };

  const formatarData = (data: string) => {
   if (!data) return '';
   const [ano, mes, dia] = data.split('-');
   return `${dia}/${mes}/${ano}`;
   }

  const handleNomeChange = (text: string) => {
  setNome(text);

  if (text.trim() === '') {
    setClienteSelecionado(null);
    setEmail('');
    setTelefone('');
    setDataNascimento('');
  }
};  
  const handleTelefoneChange = (text: string) => {
  const formatted = text
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');

  setTelefone(formatted);
};

const handleDataNascimentoChange = (text: string) => {
  const formatted = text
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\/\d{4})\d+?$/, '$1');

  setDataNascimento(formatted);
};

const salvarCadastro = async () => {
  const telefoneLimpo = telefone.replace(/\D/g, '');
  const dataLimpa = dataNascimento.split('/').reverse().join('-');

  if (!nome || !telefoneLimpo || !dataLimpa) {
    alert('Por favor, preencha todos os campos.');
    return;
  }

  const clienteData = {
    nome,
    email,
    telefone: telefoneLimpo,
    data_nascimento: dataLimpa,
  };

  if (clienteSelecionado) {
    const { error } = await supabase
      .from('clientes')
      .update(clienteData)
      .eq('id', clienteSelecionado.id);

    if (error) {
      console.error('Erro ao atualizar cliente:', error);
    } else {
      alert('Cliente atualizado com sucesso!');
    }
  } else {
    const { error } = await supabase.from('clientes').insert([clienteData]);

    if (error) {
      console.error('Erro ao cadastrar cliente:', error);
    } else {
      alert('Cliente cadastrado com sucesso!');
      setNome('');
      setEmail('');
      setTelefone('');
      setDataNascimento('');
    }
  }
};

  return (
    <ImageBackground
        source={require('@/assets/images/fundo.jpeg')}
        style={styles.background}
      >
    <View style={styles.container}>
      <Text style={styles.label}>Nome</Text>
      <TextInput
        style={styles.input}
        value={nome}
        onChangeText={handleNomeChange}
        placeholder="Digite o nome"
      />
      {clientesFiltrados.length > 0 && (
        <FlatList
          data={clientesFiltrados}
          keyExtractor={item => item.id.toString()}
          style={styles.sugestoes}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSelectCliente(item)} style={styles.sugestaoItem}>
              <Text>{item.nome}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Digite o email"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Telefone</Text>
      <TextInput
        style={styles.input}
        value={telefone}
        onChangeText={handleTelefoneChange}
        placeholder="Telefone"
      />

      <Text style={styles.label}>Data de Nascimento</Text>
      <TextInput
        style={styles.input}
        value={dataNascimento}
        onChangeText={handleDataNascimentoChange}
        placeholder="Data de nascimento"
      />

      <TouchableOpacity style={styles.botao} onPress={salvarCadastro}>
        <Text style={styles.botaoTexto}>{clienteSelecionado ? 'Atualizar Cliente' : 'Cadastrar Cliente'}</Text>
      </TouchableOpacity>
    </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
  padding: 20,
  backgroundColor: '#fff',
  borderRadius: 10,
  elevation: 4,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  width: '90%',
  },
  label: {
    marginTop: 12,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  botao: {
    marginTop: 24,
    backgroundColor: '#2e86de',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sugestoes: {
    maxHeight: 150,
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
    marginTop: 4,
  },
  sugestaoItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  background: {
    flex: 1, 
    justifyContent: 'center',
    alignItems: 'center',
  },
});
