/**
 * Serviço de Notificações — FinançasPro
 *
 * Consome a fila "nova_transacao" do RabbitMQ e gera alertas financeiros.
 * Padrão baseado no estoque-service do projeto AtividadeDockerERabbitMq.
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const amqp = require('amqplib');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUE = 'nova_transacao';
const ALERT_THRESHOLD = parseFloat(process.env.ALERT_THRESHOLD) || 500;

// Armazenamento em memória das notificações
const notificacoes = [];

/**
 * Avalia a transação recebida e gera notificações/alertas.
 * @param {Object} transacao - Dados da transação
 */
function processarTransacao(transacao) {
  const { id, userId, type, amount, description, category, date } = transacao;

  console.log(`\n📨 Transação recebida: [${type.toUpperCase()}] R$ ${amount.toFixed(2)} — ${description}`);

  const notificacao = {
    id: notificacoes.length + 1,
    transacaoId: id,
    userId,
    tipo: 'info',
    mensagem: '',
    recebidoEm: new Date().toISOString(),
  };

  if (type === 'expense' && amount >= ALERT_THRESHOLD) {
    // Alerta de despesa alta
    notificacao.tipo = 'alerta';
    notificacao.mensagem = `⚠️ Despesa elevada detectada: R$ ${amount.toFixed(2)} em "${category}" (${description})`;
    console.log(`🚨 ALERTA: ${notificacao.mensagem}`);
  } else if (type === 'income') {
    notificacao.tipo = 'info';
    notificacao.mensagem = `✅ Nova receita registrada: R$ ${amount.toFixed(2)} — ${description}`;
    console.log(`💰 INFO: ${notificacao.mensagem}`);
  } else {
    notificacao.tipo = 'info';
    notificacao.mensagem = `📝 Despesa registrada: R$ ${amount.toFixed(2)} em "${category}"`;
    console.log(`📝 INFO: ${notificacao.mensagem}`);
  }

  notificacoes.push(notificacao);
}

/**
 * Conecta ao RabbitMQ e começa a consumir mensagens.
 * Reconecta automaticamente em caso de falha.
 */
async function consumirMensagens() {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertQueue(QUEUE, { durable: true });
    channel.prefetch(1); // Processa uma mensagem por vez

    console.log('✅ Conectado ao RabbitMQ');
    console.log(`👂 Aguardando mensagens na fila: ${QUEUE}`);
    console.log(`💰 Limite de alerta: R$ ${ALERT_THRESHOLD}`);

    channel.consume(QUEUE, (msg) => {
      if (!msg) return;

      try {
        const transacao = JSON.parse(msg.content.toString());
        processarTransacao(transacao);
        channel.ack(msg);
      } catch (error) {
        console.error('❌ Erro ao processar mensagem:', error.message);
        channel.nack(msg, false, true); // Recoloca na fila
      }
    });

    connection.on('close', () => {
      console.warn('⚠️  Conexão perdida. Reconectando em 5s...');
      setTimeout(consumirMensagens, 5000);
    });

    connection.on('error', (err) => {
      console.error('❌ Erro RabbitMQ:', err.message);
    });
  } catch (error) {
    console.error('❌ Falha ao conectar no RabbitMQ:', error.message);
    console.log('🔄 Tentando novamente em 5s...');
    setTimeout(consumirMensagens, 5000);
  }
}

// GET /notifications — Lista todas as notificações
app.get('/notifications', (req, res) => {
  return res.json({
    total: notificacoes.length,
    notifications: notificacoes.reverse(), // Mais recentes primeiro
  });
});

// GET /notifications/alerts — Lista somente os alertas
app.get('/notifications/alerts', (req, res) => {
  const alertas = notificacoes.filter((n) => n.tipo === 'alerta');
  return res.json({
    total: alertas.length,
    alerts: alertas.reverse(),
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'financaspro-notification-service',
    totalNotifications: notificacoes.length,
    timestamp: new Date().toISOString(),
  });
});

// Inicia o servidor e começa a consumir
app.listen(PORT, async () => {
  console.log(`\n🚀 Notification Service rodando na porta ${PORT}`);
  await consumirMensagens();
});
