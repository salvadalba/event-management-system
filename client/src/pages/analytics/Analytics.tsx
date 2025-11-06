import React, { useState, useEffect } from 'react'
import { analyticsAPI, eventsAPI, registrationsAPI } from '../../services/api-simple'
import toast from 'react-hot-toast'

interface AnalyticsData {
  overview: {
    totalEvents: number
    totalAttendees: number
    totalRevenue: number
    averageAttendance: number
  }
  eventsByMonth: Array<{
    month: string
    events: number
    attendees: number
    revenue: number
  }>
  topEvents: Array<{
    id: string
    title: string
    attendees: number
    revenue: number
    attendanceRate: number
  }>
  registrationTrends: Array<{
    date: string
    registrations: number
  }>
  attendanceByEventType: Array<{
    type: string
    events: number
    totalAttendees: number
    averageAttendance: number
  }>
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30days') // 7days, 30days, 90days, 1year
  const [selectedEvent, setSelectedEvent] = useState('all')

  useEffect(() => {
    fetchAnalyticsData()
    fetchEvents()
  }, [timeRange, selectedEvent])

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const response = await analyticsAPI.getOverview()
      setAnalyticsData(response.data)
    } catch (error: any) {
      console.error('Fetch analytics error:', error)
      toast.error('Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await eventsAPI.getAll()
      setEvents(response.data || [])
    } catch (error: any) {
      console.error('Fetch events error:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const renderBarChart = (data: Array<{ label: string; value: number; color?: string }>, maxValue: number) => {
    return (
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-medium">{item.value.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${item.color || 'bg-blue-600'}`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderLineChart = (data: Array<{ date: string; value: number }>) => {
    const maxValue = Math.max(...data.map(d => d.value))
    const minValue = Math.min(...data.map(d => d.value))
    const range = maxValue - minValue || 1

    return (
      <div className="relative h-40">
        <div className="absolute inset-0 flex items-end justify-between">
          {data.map((point, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-2 bg-blue-600 rounded-t"
                style={{
                  height: `${((point.value - minValue) / range) * 100}%`
                }}
              ></div>
              <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top">
                {new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <div className="spinner-lg mx-auto mb-4"></div>
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-gray-500">No analytics data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="page-title">Analytics Dashboard</h1>
          <p className="page-subtitle">Comprehensive insights about your events and attendees</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="1year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <div className="w-6 h-6 bg-blue-600 rounded"></div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Events</div>
              <div className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalEvents}</div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full">
              <div className="w-6 h-6 bg-green-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Attendees</div>
              <div className="text-2xl font-bold text-gray-900">{analyticsData.overview.totalAttendees.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-full">
              <div className="w-6 h-6 bg-yellow-600 rounded"></div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Total Revenue</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.overview.totalRevenue)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full">
              <div className="w-6 h-6 bg-purple-600 rounded-full"></div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-500">Avg Attendance</div>
              <div className="text-2xl font-bold text-gray-900">{formatPercentage(analyticsData.overview.averageAttendance)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Registration Trends */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Registration Trends</h2>
          {analyticsData.registrationTrends.length > 0 ? (
            <div>
              {renderLineChart(analyticsData.registrationTrends.map(trend => ({
                date: trend.date,
                value: trend.registrations
              })))}
              <div className="mt-4 text-sm text-gray-600 text-center">
                Registrations over time
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No registration data available
            </div>
          )}
        </div>

        {/* Events by Month */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Monthly Performance</h2>
          {analyticsData.eventsByMonth.length > 0 ? (
            <div>
              {renderBarChart(
                analyticsData.eventsByMonth.map(month => ({
                  label: new Date(month.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                  value: month.events,
                  color: 'bg-blue-600'
                })),
                Math.max(...analyticsData.eventsByMonth.map(m => m.events))
              )}
              <div className="mt-4 text-sm text-gray-600 text-center">
                Number of events per month
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No monthly data available
            </div>
          )}
        </div>
      </div>

      {/* Top Events and Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Top Performing Events */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Performing Events</h2>
          {analyticsData.topEvents.length > 0 ? (
            <div className="space-y-4">
              {analyticsData.topEvents.slice(0, 5).map((event, index) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{event.title}</div>
                    <div className="text-sm text-gray-500">
                      {event.attendees} attendees • {formatCurrency(event.revenue)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      {formatPercentage(event.attendanceRate)}
                    </div>
                    <div className="text-xs text-gray-500">Attendance</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No event performance data available
            </div>
          )}
        </div>

        {/* Attendance by Event Type */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Attendance by Category</h2>
          {analyticsData.attendanceByEventType.length > 0 ? (
            <div>
              {renderBarChart(
                analyticsData.attendanceByEventType.map(type => ({
                  label: type.type.charAt(0).toUpperCase() + type.type.slice(1),
                  value: type.totalAttendees,
                  color: 'bg-green-600'
                })),
                Math.max(...analyticsData.attendanceByEventType.map(t => t.totalAttendees))
              )}
              <div className="mt-4 text-sm text-gray-600 text-center">
                Total attendees by event type
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No category data available
            </div>
          )}
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Event Performance Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendees
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.slice(0, 10).map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{event.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(event.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {event.currentAttendees}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {event.maxAttendees}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPercentage((event.currentAttendees / event.maxAttendees) * 100)}
                      </div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(event.currentAttendees / event.maxAttendees) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(event.tickets?.reduce((sum: number, ticket: any) => sum + (ticket.price * ticket.quantitySold), 0) || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Analytics