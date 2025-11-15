import axios, { AxiosInstance, AxiosResponse } from 'axios'

// Simple API service for demo
class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: (import.meta as any)?.env?.VITE_API_BASE_URL || '/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor to handle common errors
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response
      },
      async (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  // Generic request methods
  private async request<T>(method: string, url: string, data?: any): Promise<any> {
    try {
      const response = await this.api.request({
        method,
        url,
        data,
      })

      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data
      } else {
        throw {
          success: false,
          error: error.message || 'An unexpected error occurred.',
        }
      }
    }
  }

  async get<T>(url: string): Promise<T> {
    return this.request<T>('GET', url)
  }

  async post<T>(url: string, data?: any): Promise<T> {
    return this.request<T>('POST', url, data)
  }

  async put<T>(url: string, data?: any): Promise<T> {
    return this.request<T>('PUT', url, data)
  }

  async delete<T>(url: string): Promise<T> {
    return this.request<T>('DELETE', url)
  }
}

const apiService = new ApiService()

// API services for different modules
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiService.post('/auth/login', credentials),
  register: (userData: { firstName: string; lastName: string; email: string; password: string; role?: string }) =>
    apiService.post('/auth/register', userData),
  getCurrentUser: () =>
    apiService.get('/auth/me'),
  refreshToken: (data: { refreshToken: string }) =>
    apiService.post('/auth/refresh', data),
  logout: () =>
    apiService.post('/auth/logout'),
}

export const eventsAPI = {
  getAll: () =>
    apiService.get('/events'),
  getById: (id: string) =>
    apiService.get(`/events/${id}`),
  create: (eventData: any) =>
    apiService.post('/events', eventData),
  update: (id: string, eventData: any) =>
    apiService.put(`/events/${id}`, eventData),
  delete: (id: string) =>
    apiService.delete(`/events/${id}`),
}

export const analyticsAPI = {
  getOverview: () =>
    apiService.get('/analytics/overview'),
}

export const communicationsAPI = {
  getAll: () =>
    apiService.get('/communications'),
  getById: (id: string) =>
    apiService.get(`/communications/${id}`),
  create: (communicationData: any) =>
    apiService.post('/communications', communicationData),
  update: (id: string, data: any) =>
    apiService.put(`/communications/${id}`, data),
  delete: (id: string) =>
    apiService.delete(`/communications/${id}`),
  send: (id: string) =>
    apiService.post(`/communications/${id}/send`),
  schedule: (id: string, scheduledAt: string) =>
    apiService.post(`/communications/${id}/schedule`, { scheduledAt }),
}

export const registrationsAPI = {
  getAll: () =>
    apiService.get('/registrations'),
  getById: (id: string) =>
    apiService.get(`/registrations/${id}`),
  create: (registrationData: any) =>
    apiService.post('/registrations', registrationData),
  update: (id: string, data: any) =>
    apiService.put(`/registrations/${id}`, data),
  delete: (id: string) =>
    apiService.delete(`/registrations/${id}`),
  checkIn: (id: string) =>
    apiService.post(`/registrations/${id}/checkin`),
}

export const ticketsAPI = {
  getByEvent: (eventId: string) =>
    apiService.get(`/events/${eventId}/tickets`),
}

export default apiService
