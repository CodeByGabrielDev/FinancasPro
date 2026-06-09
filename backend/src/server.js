require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');
const { conectar: conectarRabbitMQ } = require('./services/rabbitmqService');

const PORT = process.env.PORT || 3000;

async function iniciar() {
  try {
    // Sincroniza os modelos com o banco (cria tabelas se não existirem)
    await sequelize.sync({ alter: true });
    console.log('✅ Banco de dados sincronizado');

    // Conecta ao RabbitMQ
    await conectarRabbitMQ();

    app.listen(PORT, () => {
      console.log(`🚀 FinançasPro Backend rodando na porta ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar o servidor:', error);
    process.exit(1);
  }
}

iniciar();
