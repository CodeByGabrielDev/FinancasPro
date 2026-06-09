/**
 * Serviço de Sincronização Offline — FinançasPro Mobile
 * Baseado no padrão do projeto sincronizacaoOff/mobile/services/sync.js
 *
 * Fluxo:
 * 1. Verifica conectividade com NetInfo
 * 2. Busca transações pendentes (sincronizado = 0) no SQLite local
 * 3. Para cada pendente, envia para a API e marca como sincronizado
 * 4. Após sincronizar, faz GET na API e atualiza o banco local completo
 */
import NetInfo from '@react-native-community/netinfo';
import { transactionsAPI } from './api';
import {
  listarPendentes,
  marcarComoSincronizado,
  substituirTransacoesComServidor,
} from '../database/db';

/**
 * Verifica se há conexão ativa.
 * @returns {Promise<boolean>}
 */
async function temConexao() {
  const estado = await NetInfo.fetch();
  return estado.isConnected && estado.isInternetReachable !== false;
}

/**
 * Sincroniza as transações pendentes com a API e atualiza o banco local.
 * @returns {Promise<{ sincronizados: number, erros: number }>}
 */
export async function sincronizar() {
  if (!(await temConexao())) {
    console.log('📴 Sem conexão — sincronização adiada');
    return { sincronizados: 0, erros: 0, offline: true };
  }

  const pendentes = listarPendentes();
  let sincronizados = 0;
  let erros = 0;

  console.log(`🔄 Sincronizando ${pendentes.length} transação(ões) pendente(s)...`);

  for (const t of pendentes) {
    try {
      const res = await transactionsAPI.criar({
        type: t.type,
        amount: t.amount,
        description: t.description,
        category: t.category,
        date: t.date,
      });

      marcarComoSincronizado(t.id, res.data.transaction.id);
      sincronizados++;
      console.log(`✅ Transação ${t.id} sincronizada → servidor ID ${res.data.transaction.id}`);
    } catch (error) {
      erros++;
      console.warn(`⚠️ Falha ao sincronizar transação ${t.id}:`, error.message);
    }
  }

  // Após sincronizar pendentes, baixa lista completa do servidor para atualizar local
  try {
    const res = await transactionsAPI.listar();
    substituirTransacoesComServidor(res.data.transactions);
    console.log(`🗄️  Banco local atualizado com ${res.data.transactions.length} transação(ões) do servidor`);
  } catch (error) {
    console.warn('⚠️ Falha ao buscar transações do servidor:', error.message);
  }

  return { sincronizados, erros, offline: false };
}
