import React, { useEffect, useRef, useState } from 'react'
import { eventsAPI, checkinAPI } from '../../services/api'
import toast from 'react-hot-toast'

const Checkin: React.FC = () => {
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([])
  const [eventId, setEventId] = useState('')
  const [activeTab, setActiveTab] = useState<'scan' | 'manual' | 'stats'>('scan')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [scanning, setScanning] = useState(false)

  const [manualEmail, setManualEmail] = useState('')
  const [manualFirst, setManualFirst] = useState('')
  const [manualLast, setManualLast] = useState('')

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await eventsAPI.getAll({ limit: 50 })
        const list = (res.data?.events || res.data || []).map((e: any) => ({ id: e.id, title: e.title }))
        setEvents(list)
        if (list.length && !eventId) setEventId(list[0].id)
      } catch (e: any) {
        toast.error(e.error || 'Failed to load events')
      }
    }
    loadEvents()
  }, [])

  useEffect(() => {
    const loadStats = async () => {
      if (!eventId) return
      try {
        const res = await checkinAPI.getStats(eventId)
        setStats(res.data)
      } catch (e: any) {
        setStats(null)
      }
    }
    loadStats()
  }, [eventId])

  const startScan = async () => {
    if (!eventId) {
      toast.error('Select an event')
      return
    }
    try {
      setScanning(true)
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const codeReader = new BrowserMultiFormatReader()
      const devices = await BrowserMultiFormatReader.listVideoInputDevices()
      const deviceId = devices[0]?.deviceId
      await codeReader.decodeFromVideoDevice(deviceId || undefined, videoRef.current as HTMLVideoElement, async (result, err) => {
        if (result) {
          setScanning(false)
          const code = result.getText()
          try {
            await checkinAPI.scanQRCode({ registrationCode: code, eventId })
            toast.success('Check-in successful')
            const res = await checkinAPI.getStats(eventId)
            setStats(res.data)
          } catch (e: any) {
            toast.error(e.error || 'Check-in failed')
          }
          codeReader.reset()
        }
      })
    } catch (e: any) {
      setScanning(false)
      toast.error(e.error || 'Unable to start scanner')
    }
  }

  const manualCheckin = async () => {
    if (!eventId || !manualEmail) {
      toast.error('Enter event and email')
      return
    }
    try {
      setLoading(true)
      await checkinAPI.manualCheckin({ eventId, email: manualEmail, firstName: manualFirst || undefined, lastName: manualLast || undefined })
      toast.success('Manual check-in successful')
      const res = await checkinAPI.getStats(eventId)
      setStats(res.data)
      setManualEmail('')
      setManualFirst('')
      setManualLast('')
    } catch (e: any) {
      toast.error(e.error || 'Manual check-in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="page-title">Check-in</h1>
          <p className="page-subtitle">Scan QR codes or check in attendees manually</p>
        </div>
        <div className="w-64">
          <label className="form-label">Event</label>
          <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="input">
            {events.map(e => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="flex border-b">
          <button className={`nav-link ${activeTab === 'scan' ? 'nav-link-active' : 'nav-link-inactive'}`} onClick={() => setActiveTab('scan')}>Scan QR</button>
          <button className={`nav-link ${activeTab === 'manual' ? 'nav-link-active' : 'nav-link-inactive'}`} onClick={() => setActiveTab('manual')}>Manual</button>
          <button className={`nav-link ${activeTab === 'stats' ? 'nav-link-active' : 'nav-link-inactive'}`} onClick={() => setActiveTab('stats')}>Stats</button>
        </div>

        {activeTab === 'scan' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="aspect-video bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                  <video ref={videoRef} className="w-full h-full" muted playsInline />
                </div>
                <div className="mt-4 flex gap-3">
                  <button className="btn btn-primary" onClick={startScan} disabled={scanning}>{scanning ? 'Scanning…' : 'Start Scan'}</button>
                </div>
              </div>
              <div>
                <div className="card">
                  <div className="card-header">Instructions</div>
                  <div className="card-body text-sm text-gray-600">
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Allow camera access when prompted.</li>
                      <li>Hold the attendee QR code within the frame.</li>
                      <li>Successful scans will automatically check in.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="p-6">
            <div className="max-w-lg">
              <label className="form-label">Attendee Email</label>
              <input className="input" type="email" value={manualEmail} onChange={(e) => setManualEmail(e.target.value)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="form-label">First Name</label>
                  <input className="input" type="text" value={manualFirst} onChange={(e) => setManualFirst(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input className="input" type="text" value={manualLast} onChange={(e) => setManualLast(e.target.value)} />
                </div>
              </div>
              <div className="mt-6">
                <button className="btn btn-primary" onClick={manualCheckin} disabled={loading}>{loading ? 'Checking in…' : 'Check in'}</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="p-6">
            {!stats ? (
              <div className="text-gray-500">No stats available</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                  <div className="card-header">Totals</div>
                  <div className="card-body">
                    <div className="text-sm text-gray-700">Total registrations: {stats.totalRegistrations}</div>
                    <div className="text-sm text-gray-700">Total check-ins: {stats.totalCheckins}</div>
                    <div className="text-sm text-gray-700">Attendance rate: {stats.attendanceRate}%</div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header">By hour</div>
                  <div className="card-body">
                    <div className="space-y-2">
                      {(stats.timeSeries || []).map((row: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm"><span>{new Date(row.hour).toLocaleString()}</span><span>{row.checkins}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header">By ticket type</div>
                  <div className="card-body">
                    <div className="space-y-2">
                      {(stats.ticketTypes || []).map((t: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm"><span>{t.type}</span><span>{t.checkins}</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Checkin
