import React from 'react'

const Checkin: React.FC = () => {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="page-title">Check-in</h1>
        <p className="page-subtitle">Manage event check-ins</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-center text-gray-600">Check-in interface would be implemented here.</p>
        <div className="mt-4 flex justify-center space-x-4">
          <button className="btn btn-primary">Scan QR Code</button>
          <button className="btn btn-secondary">Manual Check-in</button>
        </div>
      </div>
    </div>
  )
}

export default Checkin