import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    'sansation_bold': require('@/assets/fonts/sansation_bold.ttf'),
  });

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace('/(tabs)/home');
      } else {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) return alert('Erro: ' + error.message);
    router.replace('/(tabs)/home');
  };

  const handleRecuperarSenha = async () => {
    if (!email) return alert('Informe seu e-mail.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://www.google.com',
    });
    alert(error ? 'Erro: ' + error.message : 'E-mail enviado!');
  };

  if (!fontsLoaded) return null;
  if (loading) return <View style={styles.container}><ActivityIndicator size="small" /></View>;

  return (
     <ImageBackground
    source={require('@/assets/images/fundo.jpeg')}
    style={styles.background}
    resizeMode="cover">

    <View style={styles.overlayBg} />
      
    <Image
        source={require('@/assets/images/logo.png')}
        style={styles.logo}
      />
    <View style={styles.overlay}>
      <Text style={styles.title}>Bem vindas ao nosso salão. 
        Entre e descubra um mundo feito para você!</Text>
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
  <View style={styles.inputWrapper}>
  <TextInput
    style={styles.inputSenha}
    placeholder="Digite sua senha"
    secureTextEntry={!senhaVisivel}
    value={senha}
    onChangeText={setSenha}
    placeholderTextColor="#aaa"
  />
  <TouchableOpacity
    onPress={() => setSenhaVisivel(!senhaVisivel)}
    style={styles.iconSenha}
  >
    <Ionicons
      name={senhaVisivel ? 'eye' : 'eye-off'}
      size={24}
      color="gray"
    />
  </TouchableOpacity>
</View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleRecuperarSenha}>
        <Text style={styles.link}>Esqueci minha senha</Text>
      </TouchableOpacity>
    </View>
  </ImageBackground>
);
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'rgba(200, 200, 200, 1)', 
    justifyContent: 'center', 
    paddingVertical: 20 },

  overlay: { 
    width: '90%',
    height: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    boxShadow: '0 4px 4px rgba(0, 0, 0, 0.25)',
    borderRadius: 20 },

  title: { 
    fontSize: 22, 
    textAlign: 'center',
    fontFamily: 'sansation_bold',
    color: 'rgba(0, 0, 0, 0.71)', 
    marginBottom: 10,
    marginTop: 10 },

  input: { 
    height: 50,
    width: '90%',
    alignSelf: 'center',
    borderColor: 'rgba(255, 179, 179, 0.53)', 
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.71)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'sansation_bold'},

  inputWrapper: {
    width: '90%',
    alignSelf: 'center',
    position: 'relative',
    marginBottom: 15},

  inputSenha: {
    height: 50,
    borderColor: 'rgba(255, 179, 179, 0.53)', 
    borderWidth: 1,
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 45, // espaço para o ícone
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.71)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'sansation_bold'},

  iconSenha: {
    position: 'absolute',
    right: 15,
    top: 13},

  button: { 
    backgroundColor: '#FF5B5B', 
    width: '80%',
    alignSelf: 'center',
    paddingVertical: 15, 
    borderRadius: 10,
    marginTop: 30 },
  
  buttonText: { 
    color: '#fff', 
    textAlign: 'center', 
    fontSize: 16, 
    fontWeight: 'bold' },

  link: { 
    color: '#0a7ea4', 
    textAlign: 'center', 
    marginTop: 20, 
    fontSize: 16, 
    fontWeight: 'bold', 
    textDecorationLine: 'underline' },

  background: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'},

  overlayBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.21)'
  },
  logo: {
    width: 280,
    height: 180,
    marginBottom: 20,
  },
});