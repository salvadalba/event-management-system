import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { eventsAPI } from '../../services/api-simple'
import toast from 'react-hot-toast'

interface EventFormData {
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
  status: 'draft' | 'published'
  isFeatured: boolean
  tags: string[]
}

const CreateEvent: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    shortDescription: '',
    venue: {
      name: '',
      address: '',
      city: '',
      country: ''
    },
    startDate: '',
    endDate: '',
    maxAttendees: 100,
    status: 'draft',
    isFeatured: false,
    tags: []
  })

  const [tagInput, setTagInput] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }))
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      await eventsAPI.create(formData)
      toast.success('Event created successfully!')
      navigate('/events')
    } catch (error: any) {
      console.error('Create event error:', error)
      toast.error(error.error || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="page-title">Create Event</h1>
        <p className="page-subtitle">Create a new event for your organization</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="form-label">Event Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">Short Description</label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  className="input"
                  placeholder="Brief summary for event listings"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">Full Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Venue Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Venue Information</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="form-label">Venue Name *</label>
                <input
                  type="text"
                  name="venue.name"
                  value={formData.venue.name}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="form-label">City *</label>
                <input
                  type="text"
                  name="venue.city"
                  value={formData.venue.city}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="form-label">Address *</label>
                <input
                  type="text"
                  name="venue.address"
                  value={formData.venue.address}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Country *</label>
                <input
                  type="text"
                  name="venue.country"
                  value={formData.venue.country}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Event Details</h3>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="form-label">Start Date & Time *</label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="form-label">End Date & Time *</label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Maximum Attendees *</label>
                <input
                  type="number"
                  name="maxAttendees"
                  value={formData.maxAttendees}
                  onChange={handleChange}
                  min="1"
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  placeholder="Add a tag..."
                  className="input flex-1"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="btn btn-secondary"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Options */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Options</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Feature this event on homepage</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/events')}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default CreateEvent