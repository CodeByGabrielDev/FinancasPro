import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Preencha e-mail e senha.'); return }

    setLoading(true)
    try {
      const { data } = await authAPI.login({ email, password })
      login(data.token, data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-dark-900">
      <div className="w-full max-w-md bg-dark-800 border border-dark-600 rounded-2xl p-9">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl">💰</span>
          <h1 className="text-3xl font-bold mt-2">FinançasPro</h1>
          <p className="text-slate-400 text-sm mt-1">Controle seu dinheiro com inteligência</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-sm
                         text-slate-100 placeholder-slate-500 focus:outline-none focus:border-green-400
                         transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••"
              className="w-full bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-sm
                         text-slate-100 placeholder-slate-500 focus:outline-none focus:border-green-400
                         transition-colors"
            />
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
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Não tem conta?{' '}
          <Link to="/register" className="text-green-400 font-semibold hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
