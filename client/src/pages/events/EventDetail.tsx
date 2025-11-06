import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { eventsAPI } from '../../services/api-simple'
import toast from 'react-hot-toast'

interface Event {
  id: string
  title: string
  description: string
  shortDescription: string
  venue: {
    name: string
    address: string
    city: string
    country: string
  }
  startDate: string
  endDate: string
  maxAttendees: number
  currentAttendees: number
  status: 'draft' | 'published'
  isFeatured: boolean
  tags: string[]
  createdAt: string
  organizer: {
    id: string
    firstName: string
    lastName: string
  }
  tickets?: {
    id: string
    name: string
    description: string
    type: string
    price: number
    currency: string
    quantityAvailable: number
    quantitySold: number
  }[]
}

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchEvent(id)
    }
  }, [id])

  const fetchEvent = async (eventId: string) => {
    try {
      setLoading(true)
      const response = await eventsAPI.getById(eventId)
      setEvent(response.data)
    } catch (error: any) {
      console.error('Fetch event error:', error)
      toast.error('Failed to load event details')
      if (error.error?.includes('not found')) {
        navigate('/events')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!event || !window.confirm(`Are you sure you want to delete "${event.title}"? This action cannot be undone.`)) {
      return
    }

    try {
      await eventsAPI.delete(event.id)
      toast.success('Event deleted successfully')
      navigate('/events')
    } catch (error: any) {
      console.error('Delete event error:', error)
      toast.error(error.error || 'Failed to delete event')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    return status === 'published'
      ? <span className="badge badge-success">Published</span>
      : <span className="badge badge-warning">Draft</span>
  }

  const attendancePercentage = event ? (event.currentAttendees / event.maxAttendees) * 100 : 0

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="spinner-lg mx-auto mb-4"></div>
          <p className="text-gray-500">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Event not found</p>
          <Link to="/events" className="btn btn-primary mt-4">
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="page-title">{event.title}</h1>
          <p className="page-subtitle">Event details and management</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/events/${event.id}/edit`}
            className="btn btn-secondary"
          >
            Edit Event
          </Link>
          <button
            onClick={handleDelete}
            className="btn btn-danger"
          >
            Delete Event
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Overview */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Event Overview</h2>
              {getStatusBadge(event.status)}
            </div>

            {event.isFeatured && (
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  ⭐ Featured Event
                </span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{event.description}</p>
              </div>

              {event.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Venue Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Venue Information</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Venue:</span>
                <span className="ml-2 text-gray-600">{event.venue.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Address:</span>
                <span className="ml-2 text-gray-600">{event.venue.address}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">City:</span>
                <span className="ml-2 text-gray-600">{event.venue.city}, {event.venue.country}</span>
              </div>
            </div>
          </div>

          {/* Tickets */}
          {event.tickets && event.tickets.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Tickets</h2>
              <div className="space-y-4">
                {event.tickets.map((ticket) => (
                  <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{ticket.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          ${ticket.price.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {ticket.quantitySold}/{ticket.quantityAvailable} sold
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Start Date</div>
                <div className="text-gray-900">{formatDate(event.startDate)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">End Date</div>
                <div className="text-gray-900">{formatDate(event.endDate)}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Maximum Attendees</div>
                <div className="text-gray-900">{event.maxAttendees}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Current Attendees</div>
                <div className="text-gray-900">{event.currentAttendees}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Attendance Progress</div>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{attendancePercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${attendancePercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Organizer */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Organizer</h2>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {event.organizer.firstName?.charAt(0)}{event.organizer.lastName?.charAt(0)}
                </span>
              </div>
              <div className="ml-4">
                <div className="font-medium text-gray-900">
                  {event.organizer.firstName} {event.organizer.lastName}
                </div>
                <div className="text-sm text-gray-500">Event Organizer</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              <Link
                to={`/events/${event.id}/edit`}
                className="btn btn-secondary w-full"
              >
                Edit Event
              </Link>
              <button
                onClick={handleDelete}
                className="btn btn-danger w-full"
              >
                Delete Event
              </button>
              <Link
                to="/events"
                className="btn btn-outline w-full"
              >
                Back to Events
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetail