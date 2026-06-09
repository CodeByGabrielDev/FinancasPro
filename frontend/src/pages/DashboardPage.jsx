import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { transactionsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { brl, fmtDate } from '../utils/format'

function SummaryCard({ label, value, icon, colorClass, subtext }) {
  return (
    <div className={`bg-dark-800 border border-dark-600 rounded-2xl p-5 border-l-4 ${colorClass}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colorClass.replace('border-l-4 border-', 'text-')}`}>
        {value}
      </p>
      {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
    </div>
  )
}

function TxRow({ tx, onDelete }) {
  const isIncome = tx.type === 'income'
  return (
    <div className="flex items-center gap-3 bg-dark-800 border border-dark-600 rounded-xl p-3.5
                    hover:bg-dark-700 transition-colors group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0
                       ${isIncome ? 'bg-green-400/10' : 'bg-red-400/10'}`}>
        {isIncome ? '💚' : '🔴'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{tx.description}</p>
        <p className="text-xs text-slate-400 mt-0.5">{tx.category} · {fmtDate(tx.date)}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className={`text-sm font-bold ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
          {isIncome ? '+' : '-'}{brl(tx.amount)}
        </span>
        <button
          onClick={() => onDelete(tx.id)}
          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400
                     transition-all text-base"
          title="Excluir"
        >
          🗑
        </button>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [recent,  setRecent]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  async function load() {
    setError('')
    try {
      const [sumRes, txRes] = await Promise.all([
        transactionsAPI.resumo(),
        transactionsAPI.listar(),
      ])
      setSummary(sumRes.data)
      setRecent((txRes.data.transactions || []).slice(0, 6))
    } catch (e) {
      setError('Não foi possível carregar os dados. Verifique se o backend está rodando.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id) {
    if (!confirm('Excluir esta transação?')) return
    try {
      await transactionsAPI.remover(id)
      load()
    } catch {
      alert('Erro ao excluir.')
    }
  }

  const firstName = user?.name?.split(' ')[0] || 'usuário'

  return (
    <div className="space-y-7">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">Olá, {firstName} 👋</h1>
        <p className="text-slate-400 text-sm mt-0.5">Aqui está seu resumo financeiro</p>
      </div>

      {error && (
        <div className="bg-red-400/10 border border-red-400 text-red-400 rounded-xl p-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-dark-800 border border-dark-600 rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      ) : summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard
            label="Saldo Atual"
            value={brl(summary.balance)}
            icon="💼"
            colorClass={summary.balance >= 0 ? 'border-l-4 border-blue-400' : 'border-l-4 border-red-400'}
            subtext={summary.balance >= 0 ? 'Você está no positivo 🎉' : 'Atenção: saldo negativo ⚠️'}
          />
          <SummaryCard
            label="Total Receitas"
            value={brl(summary.totalIncome)}
            icon="📈"
            colorClass="border-l-4 border-green-400"
          />
          <SummaryCard
            label="Total Despesas"
            value={brl(summary.totalExpense)}
            icon="📉"
            colorClass="border-l-4 border-red-400"
          />
        </div>
      )}

      {/* Recent transactions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold">Últimas transações</h2>
          <Link
            to="/add"
            className="bg-green-400 text-dark-900 text-xs font-bold px-3.5 py-2 rounded-xl
                       hover:bg-green-300 transition-colors"
          >
            + Nova Transação
          </Link>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map(i => (
              <div key={i} className="bg-dark-800 border border-dark-600 rounded-xl h-16 animate-pulse" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-14 text-slate-500">
            <div className="text-4xl mb-3">📊</div>
            <p>Nenhuma transação ainda.</p>
            <Link to="/add" className="text-green-400 text-sm font-semibold hover:underline mt-1 block">
              Adicionar primeira transação →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(tx => (
              <TxRow key={tx.id} tx={tx} onDelete={handleDelete} />
            ))}
            <Link
              to="/transactions"
              className="block text-center text-green-400 text-sm font-semibold py-3 hover:underline"
            >
              Ver todas as transações →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
