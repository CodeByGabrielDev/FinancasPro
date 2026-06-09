import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { transactionsAPI } from '../services/api';
import { inserirTransacaoLocal } from '../database/db';

const CATEGORIES = ['Renda', 'Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Outros'];

export default function AddTransactionScreen({ navigation }) {
  const [type, setType] = useState('expense'); // 'income' | 'expense'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Outros');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  async function handleSalvar() {
    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert('Atenção', 'Informe um valor válido maior que zero.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Atenção', 'Informe uma descrição.');
      return;
    }

    setLoading(true);

    try {
      const estado = await NetInfo.fetch();
      const online = estado.isConnected && estado.isInternetReachable !== false;

      if (online) {
        // Online: salva direto na API
        await transactionsAPI.criar({
          type,
          amount: parseFloat(amount),
          description: description.trim(),
          category,
          date,
        });
        Alert.alert('✅ Sucesso', 'Transação salva com sucesso!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        // Offline: salva localmente para sincronizar depois
        inserirTransacaoLocal(
          type,
          parseFloat(amount),
          description.trim(),
          category,
          date
        );
        Alert.alert(
          '⏳ Salvo offline',
          'Sem conexão. A transação será sincronizada automaticamente quando a internet for restaurada.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      // Fallback offline se a API falhar
      inserirTransacaoLocal(type, parseFloat(amount), description.trim(), category, date);
      Alert.alert(
        '⏳ Salvo localmente',
        'Não foi possível conectar ao servidor. A transação foi salva offline.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Nova Transação</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Toggle Tipo */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'expense' && styles.typeBtnExpenseActive]}
            onPress={() => setType('expense')}
          >
            <Text style={[styles.typeBtnText, type === 'expense' && { color: '#f87171' }]}>
              📉 Despesa
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'income' && styles.typeBtnIncomeActive]}
            onPress={() => setType('income')}
          >
            <Text style={[styles.typeBtnText, type === 'income' && { color: '#4ade80' }]}>
              📈 Receita
            </Text>
          </TouchableOpacity>
        </View>

        {/* Valor */}
        <Text style={styles.label}>Valor (R$) *</Text>
        <TextInput
          style={[styles.input, styles.amountInput]}
          placeholder="0,00"
          placeholderTextColor="#475569"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />

        {/* Descrição */}
        <Text style={styles.label}>Descrição *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Salário, Aluguel, Mercado..."
          placeholderTextColor="#64748b"
          value={description}
          onChangeText={setDescription}
        />

        {/* Data */}
        <Text style={styles.label}>Data</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#64748b"
          value={date}
          onChangeText={setDate}
        />

        {/* Categoria */}
        <Text style={styles.label}>Categoria</Text>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Botão salvar */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSalvar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#0f172a" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Transação</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  inner: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  closeBtnText: { color: '#94a3b8', fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#f1f5f9' },
  typeToggle: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 14, padding: 4, marginBottom: 24 },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
  typeBtnExpenseActive: { backgroundColor: '#f8717120', borderWidth: 1, borderColor: '#f87171' },
  typeBtnIncomeActive: { backgroundColor: '#4ade8020', borderWidth: 1, borderColor: '#4ade80' },
  typeBtnText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 8, marginTop: 16 },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#334155',
  },
  amountInput: { fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryChipActive: { backgroundColor: '#4ade8020', borderColor: '#4ade80' },
  categoryChipText: { fontSize: 13, color: '#64748b' },
  categoryChipTextActive: { color: '#4ade80', fontWeight: 'bold' },
  saveButton: {
    backgroundColor: '#4ade80',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#0f172a', fontSize: 16, fontWeight: 'bold' },
});
