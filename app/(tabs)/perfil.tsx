import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function Perfil() {
  const [userData, setUserData] = useState({ nome: '', email: '', photo_url: '', cargo: '', telefone: '' });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    };
    fetchSession();
  }, []);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error(error);
    } else {
      setUserData(data);
    }

    setLoading(false);
  };

  const handleSave = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('usuarios')
      .update({ nome: userData.nome, email: userData.email, foto_url: userData.photo_url, cargo: userData.cargo, telefone: userData.telefone })
      .eq('id', session.user.id);

    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    } else {
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permissão negada', 'Você precisa permitir o acesso à galeria.');
      return;
    }

    const selecionarImagem = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 1,
  });

  if (!result.canceled) {
    const imageUri = result.assets[0].uri;
    await uploadImage(imageUri);
  }
};

    const uploadImage = async (imageUri: string) => {
      const imageName = `${session?.user.id}.jpg`;
      const { error } = await supabase.storage.from('avatars').upload(imageName, imageUri);

      if (error) {
        Alert.alert('Erro', 'Erro ao fazer upload da imagem.');
      } else {
        const url = supabase.storage.from('avatars').getPublicUrl(imageName).data.publicUrl;
        setUserData({ ...userData, photo_url: url });
      }
    }
  };

  if (loading) return <Text>Carregando...</Text>;

  return (
    <View style={styles.container}>
      {userData.photo_url ? (
        <Image source={{ uri: userData.photo_url }} style={styles.foto} />
      ) : (
        <View style={[styles.foto, { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }]}>
          <Text>Sem foto</Text>
        </View>
      )}

      <TouchableOpacity onPress={handlePickImage} style={styles.botaoFoto}>
        <Text style={styles.botaoTexto}>Selecionar nova foto</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={userData.nome}
        onChangeText={(text) => setUserData({ ...userData, nome: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={userData.email}
        onChangeText={(text) => setUserData({ ...userData, email: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Telefone"
        value={userData.telefone}
        onChangeText={(text) => setUserData({ ...userData, telefone: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Função"
        value={userData.cargo}
        onChangeText={(text) => setUserData({ ...userData, cargo: text })}
      />

      <TouchableOpacity onPress={handleSave} style={styles.botao}>
        <Text style={styles.botaoTexto}>Salvar alterações</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleLogout} style={[styles.botao, { backgroundColor: 'tomato' }]}>
        <Text style={styles.botaoTexto}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#fff', 
    alignItems: 'center',
 },
  foto: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    marginTop: 40,
    marginBottom: 10,
 },
  input: { 
    width: '100%', 
    height: 50, 
    fontSize: 18,
    borderColor: '#ccc', 
    borderWidth: 1, 
    borderRadius: 8, 
    marginBottom: 10, 
    padding: 10 
},
  botao: { 
    backgroundColor: '#007AFF', 
    padding: 15, 
    borderRadius: 8, 
    width: '100%', 
    alignItems: 'center', 
    marginTop: 10 
},
  botaoTexto: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 18, 
},
  botaoFoto: {
    marginBottom: 20, 
    backgroundColor: '#ddd', 
    padding: 10, 
    borderRadius: 6 
},
});
