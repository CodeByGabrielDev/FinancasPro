const admin = require('firebase-admin');
const path  = require('path');

/**
 * Inicializa o Firebase Admin SDK usando a chave de serviço.
 * O arquivo serviceAccountKey.json deve estar na raiz de /backend.
 *
 * Em testes (NODE_ENV=test) usamos o emulador do Firestore se disponível,
 * ou simplesmente não inicializamos para não quebrar o CI sem credenciais.
 */
if (!admin.apps.length) {
  if (process.env.NODE_ENV === 'test') {
    // Modo de teste: inicializa com projeto fake (sem credenciais reais)
    admin.initializeApp({ projectId: 'financaspro-test' });
  } else {
    const credPath = path.resolve(
      process.env.FIREBASE_CREDENTIAL_PATH || './serviceAccountKey.json'
    );

    try {
      const serviceAccount = require(credPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('🔥 Firebase Admin inicializado com sucesso');
    } catch (err) {
      console.error(
        '❌ Arquivo serviceAccountKey.json não encontrado em:', credPath,
        '\n   Baixe em: Firebase Console → Configurações → Contas de serviço → Gerar nova chave'
      );
      process.exit(1);
    }
  }
}

const db = admin.firestore();

// Coleções usadas no projeto
const Collections = {
  USERS:        'users',
  TRANSACTIONS: 'transactions',
};

module.exports = { db, admin, Collections };
