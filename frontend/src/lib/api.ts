import axios, { type AxiosError } from 'axios'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('stadiumos_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Translate network/HTTP errors into readable messages
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Network down / backend not running
    if (!error.response) {
      const networkErr = new Error(
        'Cannot reach the StadiumOS backend. Make sure the server is running on port 8000.',
      )
      networkErr.name = 'NetworkError'
      return Promise.reject(networkErr)
    }

    // Expired or invalid token → send to login
    if (error.response.status === 401) {
      localStorage.removeItem('stadiumos_token')
      localStorage.removeItem('stadiumos_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)

export default api
