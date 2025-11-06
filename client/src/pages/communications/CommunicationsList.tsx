import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { communicationsAPI } from '../../services/api-simple'
import toast from 'react-hot-toast'

interface Communication {
  id: string
  subject: string
  type: 'email' | 'sms' | 'push'
  recipientType: 'all' | 'event' | 'ticket' | 'custom'
  status: 'draft' | 'scheduled' | 'sent' | 'failed'
  content: string
  scheduledAt?: string
  sentAt?: string
  createdAt: string
  event?: {
    id: string
    title: string
  }
  stats: {
    totalRecipients: number
    sentCount: number
    deliveredCount: number
    openedCount: number
    clickedCount: number
  }
}

const CommunicationsList: React.FC = () => {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    status: '',
    type: '',
    search: ''
  })

  useEffect(() => {
    fetchCommunications()
  }, [])

  const fetchCommunications = async () => {
    try {
      setLoading(true)
      const response = await communicationsAPI.getAll()
      setCommunications(response.data || [])
    } catch (error: any) {
      console.error('Fetch communications error:', error)
      toast.error('Failed to load communications')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this communication?')) {
      return
    }

    try {
      await communicationsAPI.delete(id)
      toast.success('Communication deleted successfully')
      fetchCommunications()
    } catch (error: any) {
      console.error('Delete communication error:', error)
      toast.error(error.error || 'Failed to delete communication')
    }
  }

  const handleDuplicate = async (communication: Communication) => {
    try {
      const duplicateData = {
        subject: `Copy of ${communication.subject}`,
        type: communication.type,
        recipientType: communication.recipientType,
        content: communication.content,
        eventId: communication.event?.id
      }
      await communicationsAPI.create(duplicateData)
      toast.success('Communication duplicated successfully')
      fetchCommunications()
    } catch (error: any) {
      console.error('Duplicate communication error:', error)
      toast.error('Failed to duplicate communication')
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
      draft: { color: 'badge-warning', text: 'Draft' },
      scheduled: { color: 'badge-info', text: 'Scheduled' },
      sent: { color: 'badge-success', text: 'Sent' },
      failed: { color: 'badge-danger', text: 'Failed' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return <span className={`badge ${config.color}`}>{config.text}</span>
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return '📧'
      case 'sms':
        return '📱'
      case 'push':
        return '🔔'
      default:
        return '📨'
    }
  }

  const filteredCommunications = communications.filter(communication => {
    if (filter.status && communication.status !== filter.status) return false
    if (filter.type && communication.type !== filter.type) return false
    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      return (
        communication.subject.toLowerCase().includes(searchLower) ||
        communication.content.toLowerCase().includes(searchLower) ||
        communication.event?.title.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="spinner-lg mx-auto mb-4"></div>
          <p className="text-gray-500">Loading communications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="page-title">Communications</h1>
          <p className="page-subtitle">Manage email and SMS campaigns</p>
        </div>
        <Link
          to="/communications/new"
          className="btn btn-primary"
        >
          Create Communication
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="form-label">Search</label>
            <input
              type="text"
              placeholder="Search by subject or content..."
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
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="form-label">Type</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
              className="input"
            >
              <option value="">All Types</option>
              <option value="email">Email</option>
              <option value="sms">SMS</option>
              <option value="push">Push Notification</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilter({ status: '', type: '', search: '' })}
              className="btn btn-outline w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Communications List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {filteredCommunications.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">No communications found</div>
            <p className="text-gray-500 mb-4">Create your first communication campaign</p>
            <Link
              to="/communications/new"
              className="btn btn-primary"
            >
              Create Communication
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Communication
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCommunications.map((communication) => (
                  <tr key={communication.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {communication.subject}
                        </div>
                        {communication.event && (
                          <div className="text-sm text-gray-500">
                            Event: {communication.event.title}
                          </div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          {communication.content.slice(0, 100)}...
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getTypeIcon(communication.type)}</span>
                        <span className="text-sm text-gray-900 capitalize">{communication.type}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(communication.status)}
                      {communication.scheduledAt && communication.status === 'scheduled' && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(communication.scheduledAt)}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {communication.status === 'sent' ? (
                        <div className="text-sm">
                          <div className="flex items-center mb-1">
                            <div className="text-gray-600 mr-2">📧</div>
                            <div>
                              <span className="font-medium">{communication.stats.sentCount}</span>
                              <span className="text-gray-500">/{communication.stats.totalRecipients}</span>
                            </div>
                          </div>
                          <div className="flex items-center mb-1">
                            <div className="text-gray-600 mr-2">📖</div>
                            <span className="font-medium">{communication.stats.openedCount}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="text-gray-600 mr-2">🔗</div>
                            <span className="font-medium">{communication.stats.clickedCount}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">
                          {communication.status === 'draft' ? 'Not sent yet' :
                           communication.status === 'scheduled' ? 'Scheduled' : 'Failed'}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(communication.createdAt)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        {communication.status === 'draft' && (
                          <Link
                            to={`/communications/${communication.id}/edit`}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            Edit
                          </Link>
                        )}

                        <button
                          onClick={() => handleDuplicate(communication)}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Duplicate
                        </button>

                        <button
                          onClick={() => handleDelete(communication.id)}
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
          <div className="text-sm font-medium text-gray-500">Total Campaigns</div>
          <div className="text-2xl font-bold text-gray-900">{communications.length}</div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Sent</div>
          <div className="text-2xl font-bold text-green-600">
            {communications.filter(c => c.status === 'sent').length}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Scheduled</div>
          <div className="text-2xl font-bold text-blue-600">
            {communications.filter(c => c.status === 'scheduled').length}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Drafts</div>
          <div className="text-2xl font-bold text-yellow-600">
            {communications.filter(c => c.status === 'draft').length}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommunicationsList