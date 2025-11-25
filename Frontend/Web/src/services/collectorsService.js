import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

class CollectorsService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: `${API_BASE_URL}/collectors`,
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    })

    this.apiClient.interceptors.request.use((config) => {
      const token = sessionStorage.getItem('authToken')
      if (token) config.headers.Authorization = `Bearer ${token}`
      return config
    })

    this.apiClient.interceptors.response.use((r) => r, (e) => Promise.reject(e))
  }

  async getAllCollectors() {
    const res = await this.apiClient.get('/')
    return {
      success: res.data?.success ?? true,
      data: res.data?.data ?? res.data ?? [],
      count: res.data?.count ?? (Array.isArray(res.data) ? res.data.length : 0),
    }
  }

  async getCollectorById(id) {
    const res = await this.apiClient.get(`/${id}`)
    return {
      success: res.data?.success ?? true,
      data: res.data?.data ?? res.data ?? null,
    }
  }

  async createCollector(payload) {
    const res = await this.apiClient.post('/', payload)
    return {
      success: res.data?.success ?? true,
      data: res.data?.data ?? res.data ?? null,
    }
  }

  async updateCollector(id, payload) {
    const res = await this.apiClient.put(`/${id}`, payload)
    return {
      success: res.data?.success ?? true,
      data: res.data?.data ?? res.data ?? null,
    }
  }

  async deleteCollector(id) {
    const res = await this.apiClient.delete(`/${id}`)
    return {
      success: res.data?.success ?? true,
      data: res.data?.data ?? res.data ?? null,
    }
  }
}

export default new CollectorsService()
