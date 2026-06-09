const amqp = require('amqplib');

const QUEUE = 'nova_transacao';
let channel = null;
let connection = null;

/**
 * Conecta ao RabbitMQ e cria o canal.
 * Reconecta automaticamente em caso de falha.
 * Inspirado no padrão do pedido-service do projeto AtividadeDockerERabbitMq.
 */
async function conectar() {
  // Não tenta conectar durante os testes
  if (process.env.NODE_ENV === 'test') return;

  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();

    await channel.assertQueue(QUEUE, { durable: true });

    console.log('✅ RabbitMQ conectado — fila:', QUEUE);

    connection.on('close', () => {
      console.warn('⚠️  Conexão com RabbitMQ perdida. Reconectando em 5s...');
      channel = null;
      setTimeout(conectar, 5000);
    });

    connection.on('error', (err) => {
      console.error('❌ Erro no RabbitMQ:', err.message);
    });
  } catch (error) {
    console.error('❌ Falha ao conectar no RabbitMQ:', error.message);
    console.log('🔄 Tentando novamente em 5s...');
    setTimeout(conectar, 5000);
  }
}

/**
 * Publica uma mensagem na fila nova_transacao.
 * @param {Object} transacao - Dados da transação criada
 */
function publicarTransacao(transacao) {
  if (!channel) {
    console.warn('⚠️  RabbitMQ indisponível. Mensagem não publicada:', transacao.id);
    return;
  }

  const mensagem = JSON.stringify(transacao);
  channel.sendToQueue(QUEUE, Buffer.from(mensagem), { persistent: true });
  console.log('📤 Transação publicada na fila:', transacao.id);
}

module.exports = { conectar, publicarTransacao };
