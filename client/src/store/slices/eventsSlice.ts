import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Event } from '../../types'

interface EventsState {
  events: Event[]
  currentEvent: Event | null
  loading: boolean
  error: string | null
}

const initialState: EventsState = {
  events: [],
  currentEvent: null,
  loading: false,
  error: null,
}

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setEvents: (state, action: PayloadAction<Event[]>) => {
      state.events = action.payload
    },
    setCurrentEvent: (state, action: PayloadAction<Event>) => {
      state.currentEvent = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const { setEvents, setCurrentEvent, setLoading, setError } = eventsSlice.actions
export default eventsSlice.reducer