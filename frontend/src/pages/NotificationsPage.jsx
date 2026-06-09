import { useEffect, useState } from 'react'
import { notifAPI } from '../services/api'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [offline,       setOffline]       = useState(false)

  async function load() {
    setLoading(true)
    setOffline(false)
    try {
      const { data } = await notifAPI.listar()
      setNotifications(data.notifications || [])
    } catch {
      setOffline(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alertas & Notificações</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            Geradas pelo serviço de notificações via RabbitMQ (porta 3001)
          </p>
        </div>
        <button
          onClick={load}
          className="bg-dark-800 border border-dark-600 text-slate-300 text-xs font-semibold
                     px-3.5 py-2 rounded-xl hover:border-green-400 hover:text-green-400 transition-all"
        >
          🔄 Atualizar
        </button>
      </div>

      {offline && (
        <div className="bg-dark-800 border border-dark-600 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">🔌</div>
          <p className="text-slate-300 font-semibold">Notification service offline</p>
          <p className="text-slate-500 text-sm mt-2">
            Inicie com:{' '}
            <code className="bg-dark-700 px-2 py-0.5 rounded text-slate-300 text-xs">
              npm start
            </code>{' '}
            na pasta <code className="bg-dark-700 px-2 py-0.5 rounded text-slate-300 text-xs">notification-service</code>
          </p>
        </div>
      )}

      {loading && !offline && (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="bg-dark-800 border border-dark-600 rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && !offline && notifications.length === 0 && (
        <div className="text-center py-14 text-slate-500">
          <div className="text-4xl mb-3">🔔</div>
          <p>Nenhuma notificação ainda.</p>
          <p className="text-sm mt-1">Crie transações para gerar alertas via RabbitMQ.</p>
        </div>
      )}

      {!loading && !offline && notifications.length > 0 && (
        <div className="space-y-3">
          {notifications.map((n, i) => (
            <div
              key={i}
              className={`bg-dark-800 border border-dark-600 rounded-xl p-4 flex gap-3 items-start
                          border-l-4 ${n.tipo === 'alerta' ? 'border-l-red-400' : 'border-l-green-400'}`}
            >
              <span className="text-xl flex-shrink-0 pt-0.5">
                {n.tipo === 'alerta' ? '⚠️' : '✅'}
              </span>
              <div>
                <p className="text-sm leading-relaxed">{n.mensagem}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(n.recebidoEm).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
