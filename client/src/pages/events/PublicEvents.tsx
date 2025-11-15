import React, { useEffect, useState } from 'react'
import { publicAPI } from '../../services/api'
import { Link } from 'react-router-dom'

const PublicEvents: React.FC = () => {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const res = await publicAPI.getEvents({ search })
      setEvents(res.data?.events || [])
    } catch (e: any) {
      // no toast on public page
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="page-title">Browse Events</h1>
          <p className="page-subtitle">Find published events and discover what’s next</p>
        </div>
        <div className="w-64">
          <label className="form-label">Search</label>
          <div className="flex gap-2">
            <input className="input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or city" />
            <button className="btn btn-secondary" onClick={load}>Search</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map(e => (
            <div key={e.id} className="card">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold">{e.title}</h3>
                  {e.featuredImageUrl && (
                    <img src={e.featuredImageUrl} alt="" className="w-16 h-16 object-cover rounded" />
                  )}
                </div>
                <div className="text-sm text-gray-600 mt-1">{e.venue?.city}, {e.venue?.country}</div>
                <div className="text-sm text-gray-600 mt-1">{new Date(e.startDate).toLocaleString()}</div>
                <p className="text-sm text-gray-700 mt-3">{e.shortDescription}</p>
                <div className="mt-4 flex gap-2">
                  <Link to={`/events/${e.id}`} className="btn btn-primary btn-sm">View</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PublicEvents

