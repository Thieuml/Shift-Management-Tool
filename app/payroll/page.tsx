'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/swr'
import { WeMaintainLogo } from '@/components/WeMaintainLogo'

export default function PayrollPage() {
  // Initialize with default, then sync from localStorage after mount
  const [country, setCountry] = useState('FR')
  
  // Sync country from localStorage immediately after component mounts
  useEffect(() => {
    const savedCountry = localStorage.getItem('selectedCountry')
    if (savedCountry && (savedCountry === 'FR' || savedCountry === 'GB' || savedCountry === 'SG')) {
      setCountry(savedCountry)
    }
  }, [])
  
  // Persist country selection to localStorage
  const handleCountryChange = (code: string) => {
    setCountry(code)
    localStorage.setItem('selectedCountry', code)
  }
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState<'custom' | 'lastPayroll'>('lastPayroll')

  // Calculate default payroll period (last completed month: 22nd to 21st)
  // If today is Nov 13, last completed period is Sept 22 - Oct 21
  // If today is Nov 22 or later, last completed period is Oct 22 - Nov 21
  useEffect(() => {
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    const currentDay = today.getDate()
    
    let startMonth, endMonth, startYear, endYear
    
    if (currentDay >= 22) {
      // We're on or past the 22nd, so last completed period is previous month
      startMonth = currentMonth - 1
      endMonth = currentMonth
      startYear = currentYear
      endYear = currentYear
    } else {
      // We're before the 22nd, so last completed period is 2 months ago
      startMonth = currentMonth - 2
      endMonth = currentMonth - 1
      startYear = currentYear
      endYear = currentYear
    }
    
    // Handle year rollover
    if (startMonth < 0) {
      startMonth += 12
      startYear -= 1
    }
    if (endMonth < 0) {
      endMonth += 12
      endYear -= 1
    }
    
    // Start: 22nd of start month
    const start = new Date(startYear, startMonth, 22)
    // End: 21st of end month (end of day)
    const end = new Date(endYear, endMonth, 21, 23, 59, 59)
    
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }, [])

  // Fetch completed shifts
  const { data, isLoading, error } = useSWR(
    startDate && endDate
      ? `/api/schedule?country=${country}&from=${startDate}&to=${endDate}`
      : null,
    fetcher
  )

  // Filter for completed shifts
  const completedShifts = data?.shifts?.filter((shift: any) => shift.status === 'COMPLETED') || []

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }

  const exportToCSV = () => {
    if (completedShifts.length === 0) {
      alert('No shifts to export')
      return
    }

    // CSV headers
    const headers = [
      'Date',
      'Sector',
      'Type',
      'Planned Start',
      'Planned End',
      'Performed Start',
      'Performed End',
      'Engineer',
      'Country',
    ]

    // CSV rows
    const rows = completedShifts.map((shift: any) => {
      const engineer = shift.assignments?.[0]?.engineer?.name || 'Unassigned'
      return [
        formatDate(shift.date),
        shift.sector?.name || '-',
        shift.type,
        formatDateTime(shift.plannedStart),
        formatDateTime(shift.plannedEnd),
        shift.performedStart ? formatDateTime(shift.performedStart) : '-',
        shift.performedEnd ? formatDateTime(shift.performedEnd) : '-',
        engineer,
        shift.country?.name || shift.countryCode,
      ]
    })

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `overtime-pay-extract-${country}-${startDate}-${endDate}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const countryLabels: Record<string, string> = {
    FR: 'France',
    GB: 'United Kingdom',
    SG: 'Singapore',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <WeMaintainLogo />
        </div>
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <div className="px-3 py-2 text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Navigation
            </div>
            <a
              href="/ops"
              className="block px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Operations
            </a>
            <a
              href="/admin"
              className="block px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Shift Management
            </a>
            <a
              href="/payroll"
              className="block px-3 py-2 rounded-md bg-slate-700 text-white font-medium"
            >
              Overtime Pay Extract
            </a>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Overtime Pay Extract</h1>

          {/* Period Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <div className="flex gap-2">
                  {(['FR', 'GB', 'SG'] as const).map((code) => (
                    <button
                      key={code}
                      onClick={() => handleCountryChange(code)}
                      className={`px-4 py-1.5 rounded-md font-medium transition-colors ${
                        country === code
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {countryLabels[code]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Period Preset
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedPeriod('lastPayroll')
                      const today = new Date()
                      today.setUTCHours(0, 0, 0, 0)
                      const currentYear = today.getFullYear()
                      const currentMonth = today.getMonth()
                      const currentDay = today.getDate()
                      
                      let startMonth, endMonth, startYear, endYear
                      
                      if (currentDay >= 22) {
                        // We're on or past the 22nd, so last completed period is previous month
                        startMonth = currentMonth - 1
                        endMonth = currentMonth
                        startYear = currentYear
                        endYear = currentYear
                      } else {
                        // We're before the 22nd, so last completed period is 2 months ago
                        startMonth = currentMonth - 2
                        endMonth = currentMonth - 1
                        startYear = currentYear
                        endYear = currentYear
                      }
                      
                      // Handle year rollover
                      if (startMonth < 0) {
                        startMonth += 12
                        startYear -= 1
                      }
                      if (endMonth < 0) {
                        endMonth += 12
                        endYear -= 1
                      }
                      
                      const start = new Date(startYear, startMonth, 22)
                      const end = new Date(endYear, endMonth, 21, 23, 59, 59)
                      setStartDate(start.toISOString().split('T')[0])
                      setEndDate(end.toISOString().split('T')[0])
                    }}
                    className={`px-4 py-1.5 rounded-md font-medium transition-colors ${
                      selectedPeriod === 'lastPayroll'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Last Payroll Month (22nd - 21st)
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setSelectedPeriod('custom')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setSelectedPeriod('custom')
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-700">
              Loading completed shifts...
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-red-700">
              Error loading shifts. Please try again.
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Completed Shifts ({completedShifts.length})
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {startDate && endDate
                      ? `${formatDate(startDate)} - ${formatDate(endDate)}`
                      : 'Select a date range'}
                  </p>
                </div>
                <button
                  onClick={exportToCSV}
                  disabled={completedShifts.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Export to CSV
                </button>
              </div>

              {completedShifts.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No completed shifts found for the selected period.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Sector
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Planned Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Performed Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                          Engineer
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {completedShifts.map((shift: any) => {
                        const engineer = shift.assignments?.[0]?.engineer
                        return (
                          <tr key={shift.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatDate(shift.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {shift.sector?.name || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  shift.type === 'ONSITE'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {shift.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatTime(shift.plannedStart)} - {formatTime(shift.plannedEnd)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {shift.performedStart && shift.performedEnd ? (
                                <>
                                  {formatTime(shift.performedStart)} - {formatTime(shift.performedEnd)}
                                </>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {engineer?.name || '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
