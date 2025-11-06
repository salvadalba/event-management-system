import React, { useState, useEffect } from 'react'
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
    endDate: string
    venue: {
      name: string
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

const RegistrationsList: React.FC = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    status: '',
    eventId: '',
    search: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [registrationsResponse, eventsResponse] = await Promise.all([
        registrationsAPI.getAll(),
        eventsAPI.getAll()
      ])

      setRegistrations(registrationsResponse.data || [])
      setEvents(eventsResponse.data || [])
    } catch (error: any) {
      console.error('Fetch data error:', error)
      toast.error('Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async (registrationId: string, newStatus: string) => {
    try {
      await registrationsAPI.update(registrationId, { status: newStatus })
      toast.success('Registration status updated successfully')
      fetchData()
    } catch (error: any) {
      console.error('Status update error:', error)
      toast.error(error.error || 'Failed to update registration status')
    }
  }

  const handleDelete = async (registrationId: string) => {
    if (!window.confirm('Are you sure you want to delete this registration?')) {
      return
    }

    try {
      await registrationsAPI.delete(registrationId)
      toast.success('Registration deleted successfully')
      fetchData()
    } catch (error: any) {
      console.error('Delete registration error:', error)
      toast.error(error.error || 'Failed to delete registration')
    }
  }

  const handleCheckIn = async (registrationId: string) => {
    try {
      await registrationsAPI.checkIn(registrationId)
      toast.success('Attendee checked in successfully')
      fetchData()
    } catch (error: any) {
      console.error('Check-in error:', error)
      toast.error(error.error || 'Failed to check in attendee')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'badge-warning', text: 'Pending' },
      confirmed: { color: 'badge-success', text: 'Confirmed' },
      cancelled: { color: 'badge-danger', text: 'Cancelled' },
      checked_in: { color: 'badge-info', text: 'Checked In' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <span className={`badge ${config.color}`}>{config.text}</span>
  }

  const filteredRegistrations = registrations.filter(registration => {
    if (filter.status && registration.status !== filter.status) return false
    if (filter.eventId && registration.eventId !== filter.eventId) return false
    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      return (
        registration.attendee.firstName.toLowerCase().includes(searchLower) ||
        registration.attendee.lastName.toLowerCase().includes(searchLower) ||
        registration.attendee.email.toLowerCase().includes(searchLower) ||
        registration.event.title.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="spinner-lg mx-auto mb-4"></div>
          <p className="text-gray-500">Loading registrations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">Event Registrations</h1>
        <p className="page-subtitle">Manage attendee registrations and check-ins</p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Search</label>
            <input
              type="text"
              placeholder="Search by name, email, or event..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="input"
            />
          </div>

          <div>
            <label className="form-label">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="checked_in">Checked In</option>
            </select>
          </div>

          <div>
            <label className="form-label">Event</label>
            <select
              value={filter.eventId}
              onChange={(e) => setFilter(prev => ({ ...prev, eventId: e.target.value }))}
              className="input"
            >
              <option value="">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilter({ status: '', eventId: '', search: '' })}
              className="btn btn-outline w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Registrations Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredRegistrations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No registrations found</div>
            <p className="text-gray-500">Try adjusting your filters or check back later</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRegistrations.map((registration) => (
                  <tr key={registration.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {registration.attendee.firstName} {registration.attendee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {registration.attendee.email}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {registration.event.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {registration.event.venue.name} • {formatDate(registration.event.startDate)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{registration.ticket.name}</div>
                      <div className="text-sm text-gray-500">
                        ${registration.ticket.price.toFixed(2)} {registration.ticket.currency}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(registration.status)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(registration.registeredAt)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        {registration.status === 'confirmed' && (
                          <button
                            onClick={() => handleCheckIn(registration.id)}
                            className="text-green-600 hover:text-green-900 font-medium"
                          >
                            Check In
                          </button>
                        )}

                        {registration.status === 'pending' && (
                          <button
                            onClick={() => handleStatusUpdate(registration.id, 'confirmed')}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Confirm
                          </button>
                        )}

                        {registration.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(registration.id, 'cancelled')}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Cancel
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(registration.id)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Total Registrations</div>
          <div className="text-2xl font-bold text-gray-900">{registrations.length}</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Confirmed</div>
          <div className="text-2xl font-bold text-green-600">
            {registrations.filter(r => r.status === 'confirmed').length}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Checked In</div>
          <div className="text-2xl font-bold text-blue-600">
            {registrations.filter(r => r.status === 'checked_in').length}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">
            {registrations.filter(r => r.status === 'pending').length}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegistrationsList