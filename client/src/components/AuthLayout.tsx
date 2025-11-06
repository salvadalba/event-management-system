import React from 'react'

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Event Manager</h1>
          <p className="mt-2 text-sm text-gray-600">Complete event management solution</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export default AuthLayout