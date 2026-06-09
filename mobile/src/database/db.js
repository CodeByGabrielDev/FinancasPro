/**
 * Banco de dados local SQLite — FinançasPro Mobile
 * Baseado no padrão do projeto sincronizacaoOff/mobile/database/db.js
 *
 * Armazena transações localmente com flag "sincronizado" para suporte offline.
 */
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('financaspro.db');

/**
 * Cria as tabelas necessárias se não existirem.
 * Chamado na inicialização do app (App.js).
 */
export function criarTabelas() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      serverId    INTEGER,           -- ID retornado pela API após sincronização
      userId      INTEGER,
      type        TEXT NOT NULL,     -- 'income' ou 'expense'
      amount      REAL NOT NULL,
      description TEXT NOT NULL,
      category    TEXT DEFAULT 'Outros',
      date        TEXT NOT NULL,
      sincronizado INTEGER DEFAULT 0, -- 0 = pendente, 1 = sincronizado
      createdAt   TEXT DEFAULT (datetime('now'))
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS auth (
      id    INTEGER PRIMARY KEY,
      token TEXT,
      user  TEXT   -- JSON do usuário logado
    );
  `);
}

// ─── TRANSAÇÕES ───────────────────────────────────────────────────────────────

/**
 * Insere uma transação localmente com sincronizado = 0.
 * @returns {number} ID da transação inserida
 */
export function inserirTransacaoLocal(type, amount, description, category, date) {
  const result = db.runSync(
    `INSERT INTO transactions (type, amount, description, category, date, sincronizado)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [type, parseFloat(amount), description, category || 'Outros', date]
  );
  return result.lastInsertRowId;
}

/**
 * Lista todas as transações locais.
 * @returns {Array}
 */
export function listarTransacoesLocais() {
  return db.getAllSync('SELECT * FROM transactions ORDER BY date DESC, createdAt DESC');
}

/**
 * Lista transações pendentes de sincronização.
 * @returns {Array}
 */
export function listarPendentes() {
  return db.getAllSync('SELECT * FROM transactions WHERE sincronizado = 0');
}

/**
 * Marca uma transação como sincronizada e salva o ID do servidor.
 * @param {number} localId - ID local
 * @param {number} serverId - ID retornado pela API
 */
export function marcarComoSincronizado(localId, serverId) {
  db.runSync(
    'UPDATE transactions SET sincronizado = 1, serverId = ? WHERE id = ?',
    [serverId, localId]
  );
}

/**
 * Remove uma transação pelo ID local.
 */
export function removerTransacaoLocal(localId) {
  db.runSync('DELETE FROM transactions WHERE id = ?', [localId]);
}

/**
 * Substitui todas as transações locais pelos dados frescos da API.
 * Chamado após sincronização completa.
 * @param {Array} transactions - Transações vindas da API
 */
export function substituirTransacoesComServidor(transactions) {
  db.execSync('DELETE FROM transactions');
  for (const t of transactions) {
    db.runSync(
      `INSERT INTO transactions (serverId, type, amount, description, category, date, sincronizado)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [t.id, t.type, t.amount, t.description, t.category, t.date]
    );
  }
}

// ─── AUTH (token local) ────────────────────────────────────────────────────────

/** Salva token e dados do usuário localmente. */
export function salvarAuth(token, user) {
  db.runSync('DELETE FROM auth');
  db.runSync(
    'INSERT INTO auth (id, token, user) VALUES (1, ?, ?)',
    [token, JSON.stringify(user)]
  );
}

/** Lê token e usuário do banco local. */
export function lerAuth() {
  const row = db.getFirstSync('SELECT * FROM auth WHERE id = 1');
  if (!row) return null;
  return {
    token: row.token,
    user: JSON.parse(row.user),
  };
}

/** Remove token (logout). */
export function limparAuth() {
  db.execSync('DELETE FROM auth');
}

export default db;
