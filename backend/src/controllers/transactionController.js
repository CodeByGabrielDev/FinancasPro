const { db, Collections } = require('../config/firebase');
const { publicarTransacao } = require('../services/rabbitmqService');

/**
 * GET /transactions
 * Lista transações do usuário. Suporta filtros: ?type=income|expense&category=X
 */
async function listar(req, res) {
  try {
    const { type, category, startDate, endDate } = req.query;

    // Busca apenas pelo userId — sem orderBy no Firestore para evitar índice composto
    const snapshot = await db.collection(Collections.TRANSACTIONS)
      .where('userId', '==', req.userId)
      .get();

    let transactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Todos os filtros e ordenação em memória
    if (type)      transactions = transactions.filter(t => t.type === type);
    if (category)  transactions = transactions.filter(t => t.category === category);
    if (startDate) transactions = transactions.filter(t => t.date >= startDate);
    if (endDate)   transactions = transactions.filter(t => t.date <= endDate);

    // Ordena por data desc, depois por createdAt desc
    transactions.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.createdAt.localeCompare(a.createdAt);
    });

    return res.json({ total: transactions.length, transactions });
  } catch (error) {
    console.error('[transactionController.listar]', error);
    return res.status(500).json({ error: 'Erro ao listar transações' });
  }
}

/**
 * GET /transactions/summary
 * Retorna saldo total, receitas e despesas do usuário.
 */
async function resumo(req, res) {
  try {
    const snapshot = await db.collection(Collections.TRANSACTIONS)
      .where('userId', '==', req.userId)
      .get();

    const transactions = snapshot.docs.map(doc => doc.data());

    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    return res.json({
      balance:      parseFloat((totalIncome - totalExpense).toFixed(2)),
      totalIncome:  parseFloat(totalIncome.toFixed(2)),
      totalExpense: parseFloat(totalExpense.toFixed(2)),
    });
  } catch (error) {
    console.error('[transactionController.resumo]', error);
    return res.status(500).json({ error: 'Erro ao calcular resumo' });
  }
}

/**
 * POST /transactions
 * Cria transação no Firestore e publica na fila RabbitMQ.
 */
async function criar(req, res) {
  try {
    const { type, amount, description, category, date } = req.body;

    if (!type || !amount || !description) {
      return res.status(400).json({ error: 'Tipo, valor e descrição são obrigatórios' });
    }
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ error: 'Tipo deve ser income ou expense' });
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Valor deve ser maior que zero' });
    }

    const txData = {
      userId:      req.userId,
      type,
      amount:      parsedAmount,
      description: description.trim(),
      category:    category || 'Outros',
      date:        date || new Date().toISOString().split('T')[0],
      createdAt:   new Date().toISOString(),
    };

    const docRef = await db.collection(Collections.TRANSACTIONS).add(txData);

    const transaction = { id: docRef.id, ...txData };

    // Publica na fila RabbitMQ para o serviço de notificações
    publicarTransacao(transaction);

    return res.status(201).json({
      message: 'Transação criada com sucesso',
      transaction,
    });
  } catch (error) {
    console.error('[transactionController.criar]', error);
    return res.status(500).json({ error: 'Erro ao criar transação' });
  }
}

/**
 * PUT /transactions/:id
 * Atualiza transação (somente do usuário autenticado).
 */
async function atualizar(req, res) {
  try {
    const { id } = req.params;
    const { type, amount, description, category, date } = req.body;

    const docRef  = db.collection(Collections.TRANSACTIONS).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    const data = docSnap.data();

    // Garante que pertence ao usuário autenticado
    if (data.userId !== req.userId) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    const updates = {};
    if (type)        updates.type        = type;
    if (amount)      updates.amount      = parseFloat(amount);
    if (description) updates.description = description.trim();
    if (category)    updates.category    = category;
    if (date)        updates.date        = date;
    updates.updatedAt = new Date().toISOString();

    await docRef.update(updates);
    const updated = (await docRef.get()).data();

    return res.json({
      message: 'Transação atualizada',
      transaction: { id, ...updated },
    });
  } catch (error) {
    console.error('[transactionController.atualizar]', error);
    return res.status(500).json({ error: 'Erro ao atualizar transação' });
  }
}

/**
 * DELETE /transactions/:id
 * Remove transação (somente do usuário autenticado).
 */
async function remover(req, res) {
  try {
    const { id } = req.params;

    const docRef  = db.collection(Collections.TRANSACTIONS).doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    if (docSnap.data().userId !== req.userId) {
      return res.status(404).json({ error: 'Transação não encontrada' });
    }

    await docRef.delete();

    return res.json({ message: 'Transação removida com sucesso' });
  } catch (error) {
    console.error('[transactionController.remover]', error);
    return res.status(500).json({ error: 'Erro ao remover transação' });
  }
}

module.exports = { listar, resumo, criar, atualizar, remover };
