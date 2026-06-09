import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { transactionsAPI } from '../services/api'
import { today } from '../utils/format'

const CATEGORIES = ['Renda', 'Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Outros']

export default function AddTransactionPage() {
  const navigate = useNavigate()

  const [type,     setType]     = useState('expense')
  const [amount,   setAmount]   = useState('')
  const [desc,     setDesc]     = useState('')
  const [date,     setDate]     = useState(today())
  const [category, setCategory] = useState('Outros')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const val = parseFloat(amount)
    if (!val || val <= 0) { setError('Informe um valor válido maior que zero.'); return }
    if (!desc.trim())     { setError('Informe uma descrição.'); return }

    setLoading(true)
    try {
      await transactionsAPI.criar({
        type,
        amount: val,
        description: desc.trim(),
        category,
        date,
      })
      setSuccess('✅ Transação salva! Mensagem publicada na fila RabbitMQ.')
      setAmount('')
      setDesc('')
      setDate(today())
      setCategory('Outros')
      setTimeout(() => navigate('/'), 1800)
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar transação.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-sm ' +
    'text-slate-100 placeholder-slate-500 focus:outline-none focus:border-green-400 transition-colors'

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Nova Transação</h1>

      <div className="bg-dark-800 border border-dark-600 rounded-2xl p-6 space-y-5">

        {/* Type toggle */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
              type === 'expense'
                ? 'bg-red-400/10 border-red-400 text-red-400'
                : 'bg-dark-900 border-dark-600 text-slate-400 hover:text-slate-100'
            }`}
          >
            📉 Despesa
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
              type === 'income'
                ? 'bg-green-400/10 border-green-400 text-green-400'
                : 'bg-dark-900 border-dark-600 text-slate-400 hover:text-slate-100'
            }`}
          >
            📈 Receita
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Valor (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0,00"
              className={`${inputClass} text-2xl font-bold text-center`}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Descrição *
            </label>
            <input
              type="text"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Ex: Salário, Aluguel, Mercado..."
              className={inputClass}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Data
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Categoria
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    category === cat
                      ? 'bg-green-400/10 border-green-400 text-green-400'
                      : 'bg-dark-900 border-dark-600 text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-400/10 border border-red-400 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-400/10 border border-green-400 text-green-400 text-sm rounded-xl px-4 py-3">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-400 text-dark-900 font-bold rounded-xl py-3.5 text-sm
                       hover:bg-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Salvar Transação'}
          </button>
        </form>
      </div>
    </div>
  )
}
