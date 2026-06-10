import axios from 'axios';

/**
 * Configuração base da API.
 *
 * ⚠️ Ajuste API_BASE_URL conforme seu ambiente:
 *   - Emulador Android:              http://10.0.2.2:3000
 *   - Dispositivo físico (Wi-Fi):    http://<IP_DA_MAQUINA>:3000
 *   - iOS Simulator:                 http://localhost:3000
 *
 * Para descobrir seu IP: ipconfig (Windows) ou ifconfig (Mac/Linux)
 */
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Injeta o token JWT em todas as requisições autenticadas.
 * O token é definido pelo AuthContext via setToken().
 */
export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// ─── Transações ───────────────────────────────────────────────────────────────

export const transactionsAPI = {
  listar: (params) => api.get('/transactions', { params }),
  resumo: () => api.get('/transactions/summary'),
  criar: (data) => api.post('/transactions', data),
  atualizar: (id, data) => api.put(`/transactions/${id}`, data),
  remover: (id) => api.delete(`/transactions/${id}`),
};

export default api;
