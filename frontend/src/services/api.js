import axios from 'axios'

// ⚠️ Ajuste o IP se necessário
const API_URL       = 'http://10.3.17.217:3000'
const NOTIF_API_URL = 'http://10.3.17.217:3001'

// ─── Instância principal ───────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login:    (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
}

// ─── Transações ───────────────────────────────────────────────────────────────
export const transactionsAPI = {
  listar:    (params) => api.get('/transactions', { params }),
  resumo:    ()       => api.get('/transactions/summary'),
  criar:     (data)   => api.post('/transactions', data),
  atualizar: (id, d)  => api.put(`/transactions/${id}`, d),
  remover:   (id)     => api.delete(`/transactions/${id}`),
}

// ─── Notificações (notification-service) ──────────────────────────────────────
export const notifAPI = {
  listar: () => axios.get(`${NOTIF_API_URL}/notifications`, { timeout: 5000 }),
  health: () => axios.get(`${NOTIF_API_URL}/health`,        { timeout: 3000 }),
}

export default api
