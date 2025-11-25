import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

class VendorsService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: `${API_BASE_URL}/vendors`,
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

  async getAllVendors() {
    const res = await this.apiClient.get('/')
    return {
      success: res.data?.success ?? true,
      data: res.data?.data ?? res.data ?? [],
      count: res.data?.count ?? (Array.isArray(res.data) ? res.data.length : 0),
    }
  }

  async getVendorById(id) {
    const res = await this.apiClient.get(`/${id}`)
    return {
      success: res.data?.success ?? true,
      data: res.data?.data ?? res.data ?? null,
    }
  }

  async createVendor(payload) {
    const res = await this.apiClient.post('/', payload)
    return {
      success: res.data?.success ?? true,
      data: res.data?.data ?? res.data ?? null,
    }
  }

  async updateVendor(id, payload) {
    const res = await this.apiClient.put(`/${id}`, payload)
    return {
      success: res.data?.success ?? true,
      data: res.data?.data ?? res.data ?? null,
    }
  }

  async deleteVendor(id) {
    const res = await this.apiClient.delete(`/${id}`)
    return {
      success: res.data?.success ?? true,
      data: res.data?.data ?? res.data ?? null,
    }
  }

  async getByCollector(collectorId) {
    const res = await this.apiClient.get(`/collector/${collectorId}`)
    return {
      success: res.data?.success ?? true,
      data: res.data?.data ?? res.data ?? [],
      count: res.data?.count ?? (Array.isArray(res.data) ? res.data.length : 0),
    }
  }
}

export default new VendorsService()
