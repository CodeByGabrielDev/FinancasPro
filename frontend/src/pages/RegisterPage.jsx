import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '', expenseLimit: '2000' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function set(key) {
    return (e) => setForm(f => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const { name, email, password, expenseLimit } = form
    if (!name || !email || !password) { setError('Preencha todos os campos.'); return }
    if (password.length < 6)          { setError('Senha deve ter no mínimo 6 caracteres.'); return }

    setLoading(true)
    try {
      const { data } = await authAPI.register({
        name,
        email,
        password,
        expenseLimit: parseFloat(expenseLimit) || 2000,
      })
      login(data.token, data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao cadastrar.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-sm ' +
    'text-slate-100 placeholder-slate-500 focus:outline-none focus:border-green-400 transition-colors'

  const labelClass = 'block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-dark-900 py-10">
      <div className="w-full max-w-md bg-dark-800 border border-dark-600 rounded-2xl p-9">

        <div className="text-center mb-8">
          <span className="text-5xl">📝</span>
          <h1 className="text-2xl font-bold mt-2">Criar Conta</h1>
          <p className="text-slate-400 text-sm mt-1">Comece a controlar suas finanças hoje</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Nome completo *</label>
            <input type="text" value={form.name} onChange={set('name')}
              placeholder="Seu nome" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>E-mail *</label>
            <input type="email" value={form.email} onChange={set('email')}
              placeholder="seu@email.com" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Senha * (mín. 6 caracteres)</label>
            <input type="password" value={form.password} onChange={set('password')}
              placeholder="••••••" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Limite mensal de despesas (R$)</label>
            <input type="number" value={form.expenseLimit} onChange={set('expenseLimit')}
              placeholder="2000" className={inputClass} />
            <p className="text-xs text-slate-500 mt-1">
              Você receberá alertas ao atingir esse valor
            </p>
          </div>

          {error && (
            <div className="bg-red-400/10 border border-red-400 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-400 text-dark-900 font-bold rounded-xl py-3.5 text-sm
                       hover:bg-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Já tem conta?{' '}
          <Link to="/login" className="text-green-400 font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
