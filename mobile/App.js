import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { criarTabelas } from './src/database/db';
import { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    // Inicializa o banco local ao subir o app
    criarTabelas();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
