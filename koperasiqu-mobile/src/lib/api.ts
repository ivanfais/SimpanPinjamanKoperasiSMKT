import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { API_BASE_URL } from '../constants'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 detik — jika server tidak merespons, langsung error
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(async (cfg) => {
  const token = await AsyncStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  err => {
    if (err.code === 'ECONNABORTED' || err.code === 'ERR_NETWORK') {
      err.response = {
        data: { detail: `Tidak dapat terhubung ke server (${API_BASE_URL}). Pastikan backend berjalan dan HP terhubung ke WiFi yang sama.` }
      }
    }
    return Promise.reject(err)
  }
)

export default api
