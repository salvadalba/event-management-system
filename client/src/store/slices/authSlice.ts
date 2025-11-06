import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authAPI } from '../../services/api-simple'

// User and Credentials types
interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive?: boolean
  emailVerified?: boolean
  createdAt?: string
}

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
  role?: string
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData) => {
    const response = await authAPI.register(userData)

    // Store tokens in localStorage
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('refreshToken', response.data.refreshToken)

    return response.data
  }
)

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials) => {
    const response = await authAPI.login(credentials)

    // Store tokens in localStorage
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('refreshToken', response.data.refreshToken)

    return response.data
  }
)

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async () => {
    const response = await authAPI.getCurrentUser()
    return response.data
  }
)

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await authAPI.logout()

    // Clear tokens from localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
  }
)

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await authAPI.refreshToken({ refreshToken })

    // Update token in localStorage
    localStorage.setItem('token', response.data.token)

    return response.data.token
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user
      state.token = action.payload.token
      state.isAuthenticated = true
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Registration failed'
        state.isAuthenticated = false
      })

      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.refreshToken = action.payload.refreshToken
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Login failed'
        state.isAuthenticated = false
      })

  
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(getCurrentUser.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Failed to get user'
        state.isAuthenticated = false
        state.token = null
        state.refreshToken = null
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        state.error = null
      })

      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload
        state.error = null
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null
        state.token = null
        state.refreshToken = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
      })
  },
})

export const { clearError, setCredentials } = authSlice.actions
export default authSlice.reducer