import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { eventsAPI } from '../../services/api-simple'
import toast from 'react-hot-toast'

interface Event {
  id: string
  title: string
  description: string
  shortDescription: string
  venue: {
    name: string
    city: string
    country: string
  }
  startDate: string
  endDate: string
  maxAttendees: number
  currentAttendees: number
  status: 'draft' | 'published'
  isFeatured: number | boolean
  tags: string[]
  createdAt: string
  organizer?: {
    id: string
    firstName: string
    lastName: string
  }
  tickets?: Array<{
    id: string
    name: string
    price: number
    quantitySold: number
  }>
}

const EventsList: React.FC = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all')

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await eventsAPI.getAll()
      setEvents(response.data || [])
    } catch (error: any) {
      console.error('Fetch events error:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      await eventsAPI.delete(eventId)
      toast.success('Event deleted successfully')
      setEvents(events.filter(event => event.id !== eventId))
    } catch (error: any) {
      console.error('Delete event error:', error)
      toast.error(error.error || 'Failed to delete event')
    }
  }

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.venue.city.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || event.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    return status === 'published'
      ? <span className="badge badge-success">Published</span>
      : <span className="badge badge-warning">Draft</span>
  }

  const isEventFeatured = (isFeatured: number | boolean) => {
    return Boolean(isFeatured)
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

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="spinner-lg mx-auto mb-4"></div>
          <p className="text-gray-500">Loading events...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">Manage your events and view registrations</p>
        </div>
        <Link
          to="/events/new"
          className="btn btn-primary flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Event
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Search Events</label>
            <input
              type="text"
              placeholder="Search by title, description, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="form-label">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'published')}
              className="input"
            >
              <option value="all">All Events</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              Showing {filteredEvents.length} of {events.length} events
            </div>
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' ? 'No events match your filters.' : 'No events found.'}
            </div>
            {searchTerm || statusFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                }}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                to="/events/new"
                className="btn btn-primary"
              >
                Create Your First Event
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendees
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {event.title}
                          {isEventFeatured(event.isFeatured) && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⭐ Featured
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {event.shortDescription || event.description}
                        </div>
                        {event.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {event.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                              >
                                {tag}
                              </span>
                            ))}
                            {event.tags.length > 3 && (
                              <span className="text-xs text-gray-500">+{event.tags.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{formatDate(event.startDate)}</div>
                      <div className="text-gray-500">to {formatDate(event.endDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{event.venue.name}</div>
                      <div className="text-gray-500">{event.venue.city}, {event.venue.country}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="text-sm">{event.currentAttendees}/{event.maxAttendees}</div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{ width: `${(event.currentAttendees / event.maxAttendees) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(event.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          to={`/events/${event.id}`}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </Link>
                        <Link
                          to={`/events/${event.id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(event.id, event.title)}
                          className="text-red-600 hover:text-red-900"
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
    </div>
  )
}

export default EventsList