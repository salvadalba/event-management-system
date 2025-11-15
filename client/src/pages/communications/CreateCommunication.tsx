import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { communicationsAPI, eventsAPI } from '../../services/api-simple'
import toast from 'react-hot-toast'

interface CommunicationFormData {
  subject: string
  type: 'email' | 'sms' | 'push'
  recipientType: 'all' | 'event' | 'ticket' | 'custom'
  eventId: string
  customRecipients: string
  content: string
  scheduledAt: string
  sendImmediately: boolean
}

const CreateCommunication: React.FC = () => {
  const navigate = useNavigate()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [formData, setFormData] = useState<CommunicationFormData>({
    subject: '',
    type: 'email',
    recipientType: 'all',
    eventId: '',
    customRecipients: '',
    content: '',
    scheduledAt: '',
    sendImmediately: true
  })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getAll()
      const list = response?.data?.events || response?.data || []
      setEvents(Array.isArray(list) ? list : [])
    } catch (error: any) {
      console.error('Fetch events error:', error)
      toast.error('Failed to load events')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const validateForm = (): boolean => {
    if (!formData.subject.trim()) {
      toast.error('Subject is required')
      return false
    }

    if (!formData.content.trim()) {
      toast.error('Content is required')
      return false
    }

    if (formData.recipientType === 'event' && !formData.eventId) {
      toast.error('Please select an event')
      return false
    }

    if (formData.recipientType === 'custom' && !formData.customRecipients.trim()) {
      toast.error('Custom recipients are required')
      return false
    }

    if (!formData.sendImmediately && !formData.scheduledAt) {
      toast.error('Schedule date and time are required')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      setLoading(true)

      const communicationData: any = {
        subject: formData.subject,
        type: formData.type,
        recipientType: formData.recipientType,
        content: formData.content
      }

      if (formData.recipientType === 'event') {
        communicationData.eventId = formData.eventId
      } else if (formData.recipientType === 'custom') {
        communicationData.customRecipients = formData.customRecipients
          .split(',')
          .map(email => email.trim())
          .filter(email => email)
      }

      if (!formData.sendImmediately) {
        communicationData.scheduledAt = formData.scheduledAt
      }

      const response = await communicationsAPI.create(communicationData)

      if (formData.sendImmediately) {
        await communicationsAPI.send(response.data.id)
        toast.success('Communication sent successfully!')
      } else {
        toast.success('Communication scheduled successfully!')
      }

      navigate('/communications')
    } catch (error: any) {
      console.error('Create communication error:', error)
      toast.error(error.error || 'Failed to create communication')
    } finally {
      setLoading(false)
    }
  }

  const templates = [
    {
      name: 'Event Reminder',
      subject: 'Reminder: {event_title} is coming up!',
      content: `Hi {first_name},

This is a friendly reminder that {event_title} is coming up on {event_date} at {event_venue}.

Event Details:
• Date: {event_date}
• Time: {event_time}
• Venue: {event_venue}
• Address: {event_address}

We look forward to seeing you there!

Best regards,
The Event Team`
    },
    {
      name: 'Thank You',
      subject: 'Thank you for attending {event_title}!',
      content: `Hi {first_name},

Thank you so much for attending {event_title}! We hope you had a wonderful time.

We'd love to hear your feedback about the event. Your input helps us improve future events.

Stay tuned for more exciting events coming soon!

Best regards,
The Event Team`
    },
    {
      name: 'Event Update',
      subject: 'Important Update: {event_title}',
      content: `Hi {first_name},

We have an important update regarding {event_title}.

{update_details}

If you have any questions, please don't hesitate to contact us.

Best regards,
The Event Team`
    }
  ]

  const applyTemplate = (template: any) => {
    setFormData(prev => ({
      ...prev,
      subject: template.subject,
      content: template.content
    }))
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="page-title">Create Communication</h1>
          <p className="page-subtitle">Send email and SMS communications</p>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="btn btn-outline"
          >
            {previewMode ? 'Edit Mode' : 'Preview Mode'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Communication Details */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Communication Details</h2>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="input"
                    placeholder="Enter email subject..."
                    disabled={previewMode}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Type</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="input"
                      disabled={previewMode}
                    >
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                      <option value="push">Push Notification</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Recipients</label>
                    <select
                      name="recipientType"
                      value={formData.recipientType}
                      onChange={handleChange}
                      className="input"
                      disabled={previewMode}
                    >
                      <option value="all">All Users</option>
                      <option value="event">Event Attendees</option>
                      <option value="custom">Custom Recipients</option>
                    </select>
                  </div>
                </div>

                {formData.recipientType === 'event' && (
                  <div>
                    <label className="form-label">Select Event</label>
                    <select
                      name="eventId"
                      value={formData.eventId}
                      onChange={handleChange}
                      className="input"
                      disabled={previewMode}
                    >
                      <option value="">Choose an event...</option>
                      {events.map(event => (
                        <option key={event.id} value={event.id}>
                          {event.title} - {new Date(event.startDate).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.recipientType === 'custom' && (
                  <div>
                    <label className="form-label">Custom Recipients</label>
                    <textarea
                      name="customRecipients"
                      value={formData.customRecipients}
                      onChange={handleChange}
                      className="input"
                      rows={3}
                      placeholder="Enter email addresses separated by commas..."
                      disabled={previewMode}
                    />
                  </div>
                )}

                <div>
                  <label className="form-label">Content</label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    className="input"
                    rows={12}
                    placeholder="Enter your message here..."
                    disabled={previewMode}
                  />
                  <div className="mt-2 text-sm text-gray-500">
                    Available placeholders: {'{first_name}'}, {'{last_name}'}, {'{email}'}, {'{event_title}'}, {'{event_date}'}, {'{event_time}'}, {'{event_venue}'}, {'{event_address}'}
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Options */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Schedule Options</h2>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendImmediately"
                    name="sendImmediately"
                    checked={formData.sendImmediately}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    disabled={previewMode}
                  />
                  <label htmlFor="sendImmediately" className="ml-2 block text-sm text-gray-900">
                    Send immediately
                  </label>
                </div>

                {!formData.sendImmediately && (
                  <div>
                    <label className="form-label">Schedule Date & Time</label>
                    <input
                      type="datetime-local"
                      name="scheduledAt"
                      value={formData.scheduledAt}
                      onChange={handleChange}
                      className="input"
                      min={new Date().toISOString().slice(0, 16)}
                      disabled={previewMode}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Templates */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Templates</h2>
              <div className="space-y-3">
                {templates.map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    disabled={previewMode}
                  >
                    <div className="font-medium text-gray-900">{template.name}</div>
                    <div className="text-sm text-gray-500 truncate">{template.subject}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {previewMode && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Preview</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-gray-500">Subject</div>
                    <div className="text-gray-900">{formData.subject || 'No subject'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Type</div>
                    <div className="text-gray-900 capitalize">{formData.type}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Recipients</div>
                    <div className="text-gray-900 capitalize">{formData.recipientType}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-500">Content Preview</div>
                    <div className="text-gray-900 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                      {formData.content || 'No content'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || previewMode}
                  className="btn btn-primary w-full"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="spinner-sm mr-2"></div>
                      {formData.sendImmediately ? 'Sending...' : 'Scheduling...'}
                    </span>
                  ) : (
                    formData.sendImmediately ? 'Send Now' : 'Schedule Communication'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/communications')}
                  className="btn btn-outline w-full"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CreateCommunication
