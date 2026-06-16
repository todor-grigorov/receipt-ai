import axios from 'axios'
import { getAccessToken } from './auth'
import { error } from './logger'

export function configureHttpClient(): void {
  axios.defaults.baseURL = process.env.NEXT_PUBLIC_BACKEND_API_URL

  // ── Request interceptor — attach Bearer token ──────────
  axios.interceptors.request.use(async (config) => {
    try {
      const token = await getAccessToken()
      config.headers.Authorization = `Bearer ${token}`
    } catch (err) {
      error('Failed to acquire access token:', err)
    }
    return config
  })

  // ── Response interceptor — handle auth errors ──────────
  axios.interceptors.response.use(
    (response) => response,
    (err) => {
      if (err.response?.status === 401) {
        error('Unauthorized — redirecting to login')
        window.location.href = '/login'
      }
      return Promise.reject(err)
    }
  )
}
