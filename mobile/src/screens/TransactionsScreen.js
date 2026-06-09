import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { transactionsAPI } from '../services/api';
import { sincronizar } from '../services/sync';
import { listarTransacoesLocais, removerTransacaoLocal } from '../database/db';

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

const CATEGORIES = ['Todas', 'Renda', 'Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Outros'];

export default function TransactionsScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'income' | 'expense'
  const [isOffline, setIsOffline] = useState(false);

  async function carregarTransacoes() {
    try {
      const resultado = await sincronizar();
      setIsOffline(resultado.offline);

      if (!resultado.offline) {
        const params = {};
        if (filterType !== 'all') params.type = filterType;
        const res = await transactionsAPI.listar(params);
        setTransactions(res.data.transactions);
      } else {
        let locais = listarTransacoesLocais();
        if (filterType !== 'all') locais = locais.filter(t => t.type === filterType);
        setTransactions(locais);
      }
    } catch {
      setIsOffline(true);
      let locais = listarTransacoesLocais();
      if (filterType !== 'all') locais = locais.filter(t => t.type === filterType);
      setTransactions(locais);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      carregarTransacoes();
    }, [filterType])
  );

  function onRefresh() {
    setRefreshing(true);
    carregarTransacoes();
  }

  async function handleDelete(transaction) {
    Alert.alert(
      'Excluir transação',
      `Deseja remover "${transaction.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              if (transaction.serverId || (!transaction.sincronizado && transaction.serverId)) {
                // Remove no servidor usando serverId ou id
                const serverId = transaction.serverId || transaction.id;
                await transactionsAPI.remover(serverId);
              }
              // Remove local
              removerTransacaoLocal(transaction.id);
              setTransactions(prev => prev.filter(t => t.id !== transaction.id));
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir a transação.');
            }
          },
        },
      ]
    );
  }

  function renderItem({ item }) {
    const isPending = item.sincronizado === 0;
    return (
      <View style={styles.item}>
        <View style={styles.itemLeft}>
          <View style={[
            styles.typeIndicator,
            { backgroundColor: item.type === 'income' ? '#4ade8020' : '#f8717120' }
          ]}>
            <Text style={styles.typeEmoji}>
              {item.type === 'income' ? '📈' : '📉'}
            </Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemDesc}>{item.description}</Text>
            <Text style={styles.itemMeta}>
              {item.category} • {item.date}
              {isPending && <Text style={styles.pendingText}> · ⏳ Pendente</Text>}
            </Text>
          </View>
        </View>
        <View style={styles.itemRight}>
          <Text style={[
            styles.itemAmount,
            { color: item.type === 'income' ? '#4ade80' : '#f87171' }
          ]}>
            {item.type === 'income' ? '+' : '-'}{formatBRL(item.amount)}
          </Text>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={styles.deleteBtn}
          >
            <Text style={styles.deleteBtnText}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Transações</Text>
        {isOffline && <Text style={styles.offlineTag}>📴 Offline</Text>}
      </View>

      {/* Filtros de tipo */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'Todas' },
          { key: 'income', label: '📈 Receitas' },
          { key: 'expense', label: '📉 Despesas' },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filterType === f.key && styles.filterBtnActive]}
            onPress={() => setFilterType(f.key)}
          >
            <Text style={[styles.filterBtnText, filterType === f.key && styles.filterBtnTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#4ade80" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, index) => String(item.id || index)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ade80" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
            </View>
          }
        />
      )}

      {/* FAB para adicionar */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f1f5f9' },
  offlineTag: { fontSize: 12, color: '#9ca3af', backgroundColor: '#374151', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 14 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterBtnActive: { backgroundColor: '#4ade80', borderColor: '#4ade80' },
  filterBtnText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  filterBtnTextActive: { color: '#0f172a', fontWeight: 'bold' },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  typeIndicator: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  typeEmoji: { fontSize: 20 },
  itemInfo: { flex: 1 },
  itemDesc: { fontSize: 14, fontWeight: '600', color: '#f1f5f9' },
  itemMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  pendingText: { color: '#fbbf24' },
  itemRight: { alignItems: 'flex-end', gap: 4 },
  itemAmount: { fontSize: 15, fontWeight: 'bold' },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 16 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#64748b' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4ade80',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: { fontSize: 28, color: '#0f172a', fontWeight: 'bold', lineHeight: 30 },
});
