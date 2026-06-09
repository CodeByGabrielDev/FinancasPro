import React, { useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { transactionsAPI } from '../services/api';
import { sincronizar } from '../services/sync';
import { listarPendentes } from '../database/db';

function formatBRL(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  async function carregarResumo() {
    try {
      const res = await transactionsAPI.resumo();
      setSummary(res.data);
    } catch {
      // offline — não atualiza resumo
    }
    const pendentes = listarPendentes();
    setPendingCount(pendentes.length);
  }

  useFocusEffect(
    useCallback(() => {
      carregarResumo();
    }, [])
  );

  async function handleSincronizar() {
    setSyncing(true);
    const resultado = await sincronizar();
    setSyncing(false);

    if (resultado.offline) {
      Alert.alert('Sem conexão', 'Não foi possível sincronizar. Verifique sua internet.');
    } else {
      const pendentes = listarPendentes();
      setPendingCount(pendentes.length);
      Alert.alert(
        '✅ Sincronização concluída',
        `${resultado.sincronizados} transação(ões) sincronizada(s). ${resultado.erros} erro(s).`
      );
    }
  }

  function handleLogout() {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sua conta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Meu Perfil</Text>
      </View>

      {/* Avatar e Nome */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      {/* Limite de despesas */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>💰 Limite mensal de despesas</Text>
          <Text style={styles.cardValue}>{formatBRL(user?.expenseLimit)}</Text>
        </View>
        {summary && (
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>📉 Despesas do mês</Text>
            <Text style={[
              styles.cardValue,
              { color: summary.totalExpense >= (user?.expenseLimit || 2000) ? '#f87171' : '#4ade80' }
            ]}>
              {formatBRL(summary.totalExpense)}
            </Text>
          </View>
        )}
        {summary && summary.totalExpense >= (user?.expenseLimit || 2000) && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>
              ⚠️ Você atingiu seu limite de despesas!
            </Text>
          </View>
        )}
      </View>

      {/* Sincronização */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Sincronização Offline</Text>
        <Text style={styles.cardSubtext}>
          {pendingCount === 0
            ? '✅ Tudo sincronizado com o servidor'
            : `⏳ ${pendingCount} transação(ões) pendente(s) de sincronização`}
        </Text>
        <TouchableOpacity
          style={[styles.syncButton, syncing && { opacity: 0.6 }]}
          onPress={handleSincronizar}
          disabled={syncing}
        >
          {syncing ? (
            <ActivityIndicator color="#0f172a" size="small" />
          ) : (
            <Text style={styles.syncButtonText}>🔄 Sincronizar agora</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f1f5f9' },
  avatarSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#4ade80',
  },
  avatarEmoji: { fontSize: 36 },
  userName: { fontSize: 20, fontWeight: 'bold', color: '#f1f5f9' },
  userEmail: { fontSize: 14, color: '#64748b', marginTop: 4 },
  card: {
    marginHorizontal: 20,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLabel: { fontSize: 14, color: '#94a3b8' },
  cardValue: { fontSize: 15, fontWeight: 'bold', color: '#f1f5f9' },
  alertBanner: {
    backgroundColor: '#f8717120',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#f87171',
    marginTop: 4,
  },
  alertText: { color: '#f87171', fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#f1f5f9', marginBottom: 8 },
  cardSubtext: { fontSize: 13, color: '#94a3b8', marginBottom: 14 },
  syncButton: {
    backgroundColor: '#4ade80',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  syncButtonText: { color: '#0f172a', fontWeight: 'bold', fontSize: 14 },
  logoutButton: {
    marginHorizontal: 20,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
    marginTop: 8,
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: 'bold' },
});
