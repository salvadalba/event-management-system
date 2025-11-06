import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { ApiResponse, ApiError } from '../types'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || '/api',
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
        const originalRequest = error.config

        // Handle 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
              const response = await this.api.post('/auth/refresh', {
                refreshToken,
              })

              const { token } = response.data.data
              localStorage.setItem('token', token)

              // Retry the original request
              originalRequest.headers.Authorization = `Bearer ${token}`
              return this.api(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            localStorage.removeItem('token')
            localStorage.removeItem('refreshToken')
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  // Generic request methods
  private async request<T>(method: string, url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response = await this.api.request({
        method,
        url,
        data,
      })

      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data as ApiError
      } else if (error.request) {
        throw {
          success: false,
          error: 'Network error. Please check your connection.',
        } as ApiError
      } else {
        throw {
          success: false,
          error: error.message || 'An unexpected error occurred.',
        } as ApiError
      }
    }
  }

  async get<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>('GET', url)
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('POST', url, data)
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', url, data)
  }

  async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', url, data)
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', url)
  }

  // File upload
  async upload<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await this.api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        },
      })

      return response.data
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data as ApiError
      } else {
        throw {
          success: false,
          error: error.message || 'Upload failed',
        } as ApiError
      }
    }
  }
}

const apiService = new ApiService()

// API services for different modules
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    apiService.post('/auth/login', credentials),
  register: (userData: any) =>
    apiService.post('/auth/register', userData),
  getCurrentUser: () =>
    apiService.get('/auth/me'),
  refreshToken: (data: { refreshToken: string }) =>
    apiService.post('/auth/refresh', data),
  logout: () =>
    apiService.post('/auth/logout'),
}

export const usersAPI = {
  getAll: (params?: any) =>
    apiService.get('/users', { params }),
  getById: (id: string) =>
    apiService.get(`/users/${id}`),
  update: (id: string, data: any) =>
    apiService.put(`/users/${id}`, data),
  changePassword: (id: string, data: { currentPassword: string; newPassword: string }) =>
    apiService.put(`/users/${id}/password`, data),
  updateRole: (id: string, data: { role: string }) =>
    apiService.put(`/users/${id}/role`, data),
  updateStatus: (id: string, data: { isActive: boolean }) =>
    apiService.put(`/users/${id}/status`, data),
}

export const eventsAPI = {
  getAll: (params?: any) =>
    apiService.get('/events', { params }),
  getById: (id: string) =>
    apiService.get(`/events/${id}`),
  create: (data: any) =>
    apiService.post('/events', data),
  update: (id: string, data: any) =>
    apiService.put(`/events/${id}`, data),
  delete: (id: string) =>
    apiService.delete(`/events/${id}`),
  duplicate: (id: string) =>
    apiService.post(`/events/${id}/duplicate`),
  getTickets: (id: string) =>
    apiService.get(`/events/${id}/tickets`),
  createTicket: (eventId: string, data: any) =>
    apiService.post(`/events/${eventId}/tickets`, data),
  updateTicket: (ticketId: string, data: any) =>
    apiService.put(`/tickets/${ticketId}`, data),
  deleteTicket: (ticketId: string) =>
    apiService.delete(`/tickets/${ticketId}`),
}

export const registrationsAPI = {
  getAll: (params?: any) =>
    apiService.get('/registrations', { params }),
  getById: (id: string) =>
    apiService.get(`/registrations/${id}`),
  create: (data: any) =>
    apiService.post('/registrations', data),
  update: (id: string, data: any) =>
    apiService.put(`/registrations/${id}`, data),
  cancel: (id: string) =>
    apiService.delete(`/registrations/${id}`),
  getRegistrationsByEvent: (eventId: string, params?: any) =>
    apiService.get(`/registrations`, { params: { ...params, eventId } }),
}

export const paymentsAPI = {
  createPaymentIntent: (data: { registrationId: string; amount: number }) =>
    apiService.post('/payments/create-intent', data),
  confirmPayment: (data: { paymentIntentId: string; registrationId: string }) =>
    apiService.post('/payments/confirm', data),
}

export const checkinAPI = {
  getEventCheckins: (eventId: string, params?: any) =>
    apiService.get(`/checkin/events/${eventId}`, { params }),
  scanQRCode: (data: any) =>
    apiService.post('/checkin/scan', data),
  manualCheckin: (data: any) =>
    apiService.post('/checkin/manual', data),
  getStats: (eventId: string) =>
    apiService.get(`/checkin/stats/${eventId}`),
  printBadge: (checkinId: string) =>
    apiService.post(`/checkin/print-badge/${checkinId}`),
}

export const communicationsAPI = {
  getAll: (params?: any) =>
    apiService.get('/communications', { params }),
  getById: (id: string) =>
    apiService.get(`/communications/${id}`),
  create: (data: any) =>
    apiService.post('/communications', data),
  send: (id: string) =>
    apiService.post(`/communications/${id}/send`),
  getLogs: (id: string, params?: any) =>
    apiService.get(`/communications/${id}/logs`, { params }),
}

export const analyticsAPI = {
  getOverview: () =>
    apiService.get('/analytics/overview'),
  getEventAnalytics: (eventId: string, params?: any) =>
    apiService.get(`/analytics/events/${eventId}`, { params }),
  getTrends: (params?: any) =>
    apiService.get('/analytics/trends', { params }),
  export: (params: any) =>
    apiService.get('/analytics/export', { params }),
}

export default apiService