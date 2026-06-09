import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { transactionsAPI } from '../services/api'
import { brl, fmtDate } from '../utils/format'

const FILTERS = [
  { key: 'all',     label: 'Todas' },
  { key: 'income',  label: '📈 Receitas' },
  { key: 'expense', label: '📉 Despesas' },
]

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([])
  const [filter,       setFilter]       = useState('all')
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  async function load(type) {
    setLoading(true)
    setError('')
    try {
      const params = type !== 'all' ? { type } : {}
      const { data } = await transactionsAPI.listar(params)
      setTransactions(data.transactions || [])
    } catch {
      setError('Erro ao carregar transações.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(filter) }, [filter])

  async function handleDelete(id) {
    if (!confirm('Excluir esta transação?')) return
    try {
      await transactionsAPI.remover(id)
      load(filter)
    } catch {
      alert('Erro ao excluir.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transações</h1>
        <Link
          to="/add"
          className="bg-green-400 text-dark-900 text-xs font-bold px-3.5 py-2 rounded-xl
                     hover:bg-green-300 transition-colors"
        >
          + Nova
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
              filter === f.key
                ? 'bg-green-400 text-dark-900 border-green-400'
                : 'bg-dark-800 text-slate-400 border-dark-600 hover:text-slate-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-400/10 border border-red-400 text-red-400 rounded-xl p-4 text-sm">
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="bg-dark-800 border border-dark-600 rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-14 text-slate-500">
          <div className="text-4xl mb-3">🔍</div>
          <p>Nenhuma transação encontrada.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map(tx => {
            const isIncome = tx.type === 'income'
            return (
              <div
                key={tx.id}
                className="flex items-center gap-3 bg-dark-800 border border-dark-600 rounded-xl p-3.5
                           hover:bg-dark-700 transition-colors group"
              >
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
                    onClick={() => handleDelete(tx.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400
                               transition-all text-base"
                    title="Excluir"
                  >
                    🗑
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && transactions.length > 0 && (
        <p className="text-xs text-slate-500 text-center">
          {transactions.length} transação(ões) encontrada(s)
        </p>
      )}
    </div>
  )
}
