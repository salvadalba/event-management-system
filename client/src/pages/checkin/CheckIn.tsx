import React, { useState, useEffect, useRef } from 'react'
import { registrationsAPI, eventsAPI } from '../../services/api-simple'
import toast from 'react-hot-toast'

interface Registration {
  id: string
  eventId: string
  userId: string
  ticketId: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in'
  registeredAt: string
  qrCode: string
  event: {
    id: string
    title: string
    startDate: string
    venue: {
      name: string
      address: string
      city: string
    }
  }
  ticket: {
    id: string
    name: string
    price: number
    currency: string
  }
  attendee: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

const CheckIn: React.FC = () => {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState('')
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkInHistory, setCheckInHistory] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      fetchRegistrations(selectedEvent)
    }
  }, [selectedEvent])

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getAll()
      setEvents(response.data || [])
    } catch (error: any) {
      console.error('Fetch events error:', error)
      toast.error('Failed to load events')
    }
  }

  const fetchRegistrations = async (eventId: string) => {
    try {
      setLoading(true)
      const response = await registrationsAPI.getAll()
      const eventRegistrations = (response.data || []).filter(
        (reg: Registration) => reg.eventId === eventId && reg.status === 'confirmed'
      )
      setRegistrations(eventRegistrations)
    } catch (error: any) {
      console.error('Fetch registrations error:', error)
      toast.error('Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (registrationId: string) => {
    try {
      const registration = registrations.find(reg => reg.id === registrationId)
      if (!registration) return

      await registrationsAPI.checkIn(registrationId)
      toast.success(`${registration.attendee.firstName} ${registration.attendee.lastName} checked in successfully!`)

      // Update local state
      setRegistrations(prev => prev.filter(reg => reg.id !== registrationId))
      setCheckInHistory(prev => [
        {
          id: Date.now(),
          registrationId,
          attendee: registration.attendee,
          event: registration.event,
          checkedInAt: new Date().toISOString()
        },
        ...prev.slice(0, 9) // Keep last 10 check-ins
      ])
    } catch (error: any) {
      console.error('Check-in error:', error)
      toast.error(error.error || 'Failed to check in attendee')
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a registration ID or email')
      return
    }

    try {
      setLoading(true)
      const response = await registrationsAPI.getAll()
      const allRegistrations = response.data || []

      const found = allRegistrations.find((reg: Registration) =>
        reg.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reg.attendee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `${reg.attendee.firstName} ${reg.attendee.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
      )

      if (found) {
        if (found.status === 'checked_in') {
          toast.error('Attendee already checked in')
        } else if (found.status === 'confirmed') {
          await handleCheckIn(found.id)
        } else {
          toast.error('Registration is not confirmed')
        }
      } else {
        toast.error('Registration not found')
      }
    } catch (error: any) {
      console.error('Search error:', error)
      toast.error('Failed to search registration')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const filteredRegistrations = registrations.filter(registration =>
    registration.attendee.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    registration.attendee.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    registration.attendee.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Event Check-In</h1>
        <p className="page-subtitle">Manage attendee check-ins and registration verification</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Check-In Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Selection */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Event</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Event</label>
                <select
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  className="input"
                >
                  <option value="">Choose an event...</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.title} - {new Date(event.startDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Quick Search (ID, Email, Name)</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Search attendee..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="input flex-1"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? <div className="spinner-sm"></div> : 'Search'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Registration List */}
          {selectedEvent && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Confirmed Registrations ({filteredRegistrations.length})
                </h2>
                <div className="text-sm text-gray-500">
                  Ready for check-in
                </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="spinner-lg mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading registrations...</p>
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-lg mb-2">No confirmed registrations found</div>
                  <p className="text-gray-500">All attendees have been checked in or no registrations match your search</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredRegistrations.map((registration) => (
                    <div key={registration.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">
                            {registration.attendee.firstName} {registration.attendee.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{registration.attendee.email}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            Ticket: {registration.ticket.name} • ID: {registration.id.slice(-8)}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleCheckIn(registration.id)}
                            className="btn btn-success"
                          >
                            Check In
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Check-In Stats */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Check-In Stats</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Ready to Check In</div>
                <div className="text-2xl font-bold text-blue-600">{filteredRegistrations.length}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Checked In Today</div>
                <div className="text-2xl font-bold text-green-600">{checkInHistory.length}</div>
              </div>
              {selectedEvent && (
                <div>
                  <div className="text-sm font-medium text-gray-500">Selected Event</div>
                  <div className="text-sm text-gray-900 mt-1">
                    {events.find(e => e.id === selectedEvent)?.title}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Check-Ins */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Check-Ins</h2>
            {checkInHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">No check-ins yet today</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {checkInHistory.map((checkIn) => (
                  <div key={checkIn.id} className="border-b border-gray-100 pb-2 last:border-0">
                    <div className="font-medium text-gray-900 text-sm">
                      {checkIn.attendee.firstName} {checkIn.attendee.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {checkIn.event.title} • {formatDate(checkIn.checkedInAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-outline w-full"
              >
                Scan QR Code
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={() => toast.info('QR code scanning coming soon!')}
              />

              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-outline w-full"
              >
                Clear Search
              </button>

              <button
                onClick={() => {
                  setSelectedEvent('')
                  setRegistrations([])
                  setSearchQuery('')
                }}
                className="btn btn-outline w-full"
              >
                Reset All
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckIn