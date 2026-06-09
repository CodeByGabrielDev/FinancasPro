import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { transactionsAPI } from '../services/api';
import { sincronizar } from '../services/sync';
import { listarTransacoesLocais } from '../database/db';

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export default function DashboardScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState({ balance: 0, totalIncome: 0, totalExpense: 0 });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  async function carregarDados() {
    try {
      // Tenta sincronizar e buscar dados do servidor
      const resultado = await sincronizar();
      setIsOffline(resultado.offline);

      if (!resultado.offline) {
        // Online: busca dados da API
        const [summaryRes] = await Promise.all([
          transactionsAPI.resumo(),
        ]);
        setSummary(summaryRes.data);

        const listRes = await transactionsAPI.listar();
        setRecentTransactions(listRes.data.transactions.slice(0, 5));
      } else {
        // Offline: usa dados locais
        const locais = listarTransacoesLocais();
        const totalIncome = locais.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const totalExpense = locais.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        setSummary({
          balance: totalIncome - totalExpense,
          totalIncome,
          totalExpense,
        });
        setRecentTransactions(locais.slice(0, 5));
      }
    } catch (error) {
      // Se a API falhar, usa dados locais como fallback
      setIsOffline(true);
      const locais = listarTransacoesLocais();
      const totalIncome = locais.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalExpense = locais.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      setSummary({ balance: totalIncome - totalExpense, totalIncome, totalExpense });
      setRecentTransactions(locais.slice(0, 5));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Recarrega ao focar na tela
  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  function onRefresh() {
    setRefreshing(true);
    carregarDados();
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4ade80" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4ade80" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.headerSub}>Seu resumo financeiro</Text>
        </View>
        {isOffline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>📴 Offline</Text>
          </View>
        )}
      </View>

      {/* Card de saldo */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo atual</Text>
        <Text style={[
          styles.balanceValue,
          { color: summary.balance >= 0 ? '#4ade80' : '#f87171' }
        ]}>
          {formatBRL(summary.balance)}
        </Text>
        <Text style={styles.balanceSub}>
          {summary.balance >= 0 ? 'Você está no positivo 🎉' : 'Atenção: saldo negativo ⚠️'}
        </Text>
      </View>

      {/* Receitas e Despesas */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderLeftColor: '#4ade80' }]}>
          <Text style={styles.statEmoji}>📈</Text>
          <Text style={styles.statLabel}>Receitas</Text>
          <Text style={[styles.statValue, { color: '#4ade80' }]}>
            {formatBRL(summary.totalIncome)}
          </Text>
        </View>
        <View style={[styles.statCard, { borderLeftColor: '#f87171' }]}>
          <Text style={styles.statEmoji}>📉</Text>
          <Text style={styles.statLabel}>Despesas</Text>
          <Text style={[styles.statValue, { color: '#f87171' }]}>
            {formatBRL(summary.totalExpense)}
          </Text>
        </View>
      </View>

      {/* Botão de adicionar transação */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddTransaction')}
      >
        <Text style={styles.addButtonText}>+ Nova Transação</Text>
      </TouchableOpacity>

      {/* Transações recentes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimas transações</Text>

        {recentTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyText}>Nenhuma transação ainda.</Text>
            <Text style={styles.emptySubText}>Adicione sua primeira transação!</Text>
          </View>
        ) : (
          recentTransactions.map((t, index) => (
            <View key={t.id || index} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionEmoji}>
                  {t.type === 'income' ? '💚' : '🔴'}
                </Text>
                <View>
                  <Text style={styles.transactionDesc}>{t.description}</Text>
                  <Text style={styles.transactionCategory}>
                    {t.category} • {t.date}
                    {!t.sincronizado && t.sincronizado !== undefined && (
                      <Text style={styles.pendingBadge}> ⏳</Text>
                    )}
                  </Text>
                </View>
              </View>
              <Text style={[
                styles.transactionAmount,
                { color: t.type === 'income' ? '#4ade80' : '#f87171' }
              ]}>
                {t.type === 'income' ? '+' : '-'}{formatBRL(t.amount)}
              </Text>
            </View>
          ))
        )}

        {recentTransactions.length > 0 && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => navigation.navigate('Transactions')}
          >
            <Text style={styles.viewAllText}>Ver todas as transações →</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  headerSub: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  offlineBadge: {
    backgroundColor: '#374151',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  offlineText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  balanceCard: {
    marginHorizontal: 20,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  balanceSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
  },
  statEmoji: {
    fontSize: 22,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    marginHorizontal: 20,
    backgroundColor: '#4ade80',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 28,
  },
  addButtonText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  emptySubText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  transactionCategory: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  pendingBadge: {
    color: '#fbbf24',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  viewAllButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  viewAllText: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600',
  },
});
