import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Registration } from '../../types'

interface RegistrationsState {
  registrations: Registration[]
  currentRegistration: Registration | null
  loading: boolean
  error: string | null
}

const initialState: RegistrationsState = {
  registrations: [],
  currentRegistration: null,
  loading: false,
  error: null,
}

const registrationsSlice = createSlice({
  name: 'registrations',
  initialState,
  reducers: {
    setRegistrations: (state, action: PayloadAction<Registration[]>) => {
      state.registrations = action.payload
    },
    setCurrentRegistration: (state, action: PayloadAction<Registration>) => {
      state.currentRegistration = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const { setRegistrations, setCurrentRegistration, setLoading, setError } = registrationsSlice.actions
export default registrationsSlice.reducer