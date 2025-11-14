'use client'

import { useState, useEffect } from 'react'
import { WeMaintainLogo } from '@/components/WeMaintainLogo'
import { ShiftType } from '@prisma/client'

interface Sector {
  id: string
  name: string
  active: boolean
  countryCode: string
  country: {
    code: string
    name: string
  }
}

interface RecurringShift {
  id: string
  name: string
  start: string
  end: string
  type: ShiftType
  dow: string[]
  requiredCount: number
  countryCode: string
  country: {
    code: string
    name: string
  }
  sectorIds: string[]
  startDate: string
  endDate: string
  autoExtend: boolean
  active: boolean
}

export default function AdminPage() {
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
  const [sectors, setSectors] = useState<Sector[]>([])
  const [recurringShifts, setRecurringShifts] = useState<RecurringShift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [extendingShiftId, setExtendingShiftId] = useState<string | null>(null)
  const [extendEndDate, setExtendEndDate] = useState<string>('')
  const [creatingShift, setCreatingShift] = useState(false)
  const [deletingShiftId, setDeletingShiftId] = useState<string | null>(null)

  // Sector form state
  const [sectorForm, setSectorForm] = useState({ name: '', countryCode: 'FR' })
  const [editingSector, setEditingSector] = useState<Sector | null>(null)

  // Recurring shift form state
  const [recurringShiftForm, setRecurringShiftForm] = useState({
    name: '',
    start: '08:00',
    end: '20:00',
    type: 'ONSITE' as ShiftType,
    dow: [] as string[],
    requiredCount: 1,
    countryCode: 'FR',
    sectorIds: [] as string[],
    shiftType: 'recurring' as 'recurring' | 'one-shot',
    recurringStartDate: '',
    recurringEndDate: '',
    oneShotDate: '',
  })

  const countryLabels: Record<string, string> = {
    FR: 'France',
    GB: 'United Kingdom',
    SG: 'Singapore',
  }

  const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'PH']

  useEffect(() => {
    fetchData()
    
    // Initialize default dates for template form
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const defaultEndDate = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth() + 6,
      today.getUTCDate(),
      23, 59, 59, 999
    ))
    
    setRecurringShiftForm(prev => ({
      ...prev,
      countryCode: country,
      recurringStartDate: prev.recurringStartDate || today.toISOString().split('T')[0],
      recurringEndDate: prev.recurringEndDate || defaultEndDate.toISOString().split('T')[0],
      oneShotDate: prev.oneShotDate || today.toISOString().split('T')[0],
    }))
  }, [country])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sectorsRes, recurringShiftsRes] = await Promise.all([
        fetch(`/api/sectors?country=${country}`),
        fetch(`/api/recurring-shifts?country=${country}`),
      ])

      if (!sectorsRes.ok) {
        const errorData = await sectorsRes.json().catch(() => ({}))
        throw new Error(`Failed to fetch sectors: ${errorData.error || sectorsRes.statusText}`)
      }

      if (!recurringShiftsRes.ok) {
        const errorData = await recurringShiftsRes.json().catch(() => ({}))
        throw new Error(`Failed to fetch recurring shifts: ${errorData.error || recurringShiftsRes.statusText}`)
      }

      const sectorsData = await sectorsRes.json()
      const recurringShiftsData = await recurringShiftsRes.json()

      console.log('Sectors data:', sectorsData)
      console.log('Recurring shifts data:', recurringShiftsData)

      setSectors(sectorsData.sectors || [])
      setRecurringShifts(recurringShiftsData.recurringShifts || [])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
      // Scroll to error message
      setTimeout(() => {
        const errorElement = document.getElementById('error-message')
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSector = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/sectors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectorForm),
      })

      if (!res.ok) throw new Error('Failed to create sector')

      setSectorForm({ name: '', countryCode: country })
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sector')
    }
  }

  const handleUpdateSector = async (sector: Sector, newName: string) => {
    try {
      const res = await fetch(`/api/sectors/${sector.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      })

      if (!res.ok) throw new Error('Failed to update sector')

      setEditingSector(null)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sector')
    }
  }

  const handleDeleteSector = async (id: string) => {
    if (!confirm('Are you sure you want to delete this sector?')) return

    try {
      const res = await fetch(`/api/sectors/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error('Failed to delete sector')

      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sector')
    }
  }

  const handleCreateRecurringShift = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (creatingShift) return
    
    // Days of week validation only for recurring shifts
    if (recurringShiftForm.shiftType === 'recurring' && recurringShiftForm.dow.length === 0) {
      setError('Please select at least one day of week for recurring shifts')
      return
    }

    if (recurringShiftForm.sectorIds.length === 0) {
      setError('Please select at least one sector')
      return
    }

    // Validate date inputs based on shift type
    if (recurringShiftForm.shiftType === 'recurring') {
      if (!recurringShiftForm.recurringStartDate || !recurringShiftForm.recurringEndDate) {
        setError('Please select start and end dates for recurring shifts')
        return
      }
    } else {
      if (!recurringShiftForm.oneShotDate) {
        setError('Please select a date for one-shot shift')
        return
      }
    }

    setCreatingShift(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const res = await fetch('/api/recurring-shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: recurringShiftForm.name,
          start: recurringShiftForm.start,
          end: recurringShiftForm.end,
          type: recurringShiftForm.type,
          dow: recurringShiftForm.dow,
          requiredCount: recurringShiftForm.requiredCount,
          countryCode: recurringShiftForm.countryCode,
          sectorIds: recurringShiftForm.sectorIds,
          shiftType: recurringShiftForm.shiftType,
          recurringStartDate: recurringShiftForm.shiftType === 'recurring' ? recurringShiftForm.recurringStartDate : undefined,
          recurringEndDate: recurringShiftForm.shiftType === 'recurring' ? recurringShiftForm.recurringEndDate : undefined,
          oneShotDate: recurringShiftForm.shiftType === 'one-shot' ? recurringShiftForm.oneShotDate : undefined,
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to create recurring shift')
      }

      const data = await res.json()
      
      // Calculate default dates for next form
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      const defaultEndDate = new Date(Date.UTC(
        today.getUTCFullYear(),
        today.getUTCMonth() + 6,
        today.getUTCDate(),
        23, 59, 59, 999
      ))
      
      setRecurringShiftForm({
        name: '',
        start: '08:00',
        end: '20:00',
        type: 'ONSITE',
        dow: [],
        requiredCount: 1,
        countryCode: country,
        sectorIds: [],
        shiftType: 'recurring',
        recurringStartDate: today.toISOString().split('T')[0],
        recurringEndDate: defaultEndDate.toISOString().split('T')[0],
        oneShotDate: today.toISOString().split('T')[0],
      })
      
      // Show success message
      if (data.generatedShifts > 0) {
        setSuccessMessage(`Recurring shift created successfully! ${data.generatedShifts} shifts generated.`)
      } else {
        setSuccessMessage('Recurring shift created successfully!')
      }
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
      
      // Clear error if any
      setError(null)
      
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create recurring shift')
      // Scroll to error message
      setTimeout(() => {
        const errorElement = document.getElementById('error-message')
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    } finally {
      setCreatingShift(false)
    }
  }

  const handleDeleteRecurringShift = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recurring shift?')) return

    // Prevent multiple clicks
    if (deletingShiftId === id) return

    setDeletingShiftId(id)
    setError(null)

    try {
      const res = await fetch(`/api/recurring-shifts/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete recurring shift')
      }

      setSuccessMessage('Recurring shift deleted successfully!')
      setTimeout(() => setSuccessMessage(null), 5000)
      await fetchData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete recurring shift'
      setError(errorMessage)
      // Scroll to error message
      setTimeout(() => {
        const errorElement = document.getElementById('error-message')
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    } finally {
      setDeletingShiftId(null)
    }
  }

  const handleExtendClick = (recurringShift: RecurringShift) => {
    // Calculate default end date (6 months from current end date)
    const currentEndDate = new Date(recurringShift.endDate)
    const defaultEndDate = new Date(Date.UTC(
      currentEndDate.getUTCFullYear(),
      currentEndDate.getUTCMonth() + 6,
      currentEndDate.getUTCDate(),
      23, 59, 59, 999
    ))
    setExtendEndDate(defaultEndDate.toISOString().split('T')[0])
    setExtendingShiftId(recurringShift.id)
  }

  const handleExtendPeriod = async () => {
    if (!extendingShiftId || !extendEndDate) return

    try {
      const res = await fetch(`/api/recurring-shifts/${extendingShiftId}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endDate: extendEndDate }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to extend period')
      }

      const data = await res.json()
      setSuccessMessage(`Period extended successfully! ${data.generatedShifts} new shifts generated.`)
      setTimeout(() => setSuccessMessage(null), 5000)
      setExtendingShiftId(null)
      setExtendEndDate('')
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extend period')
      setTimeout(() => {
        const errorElement = document.getElementById('error-message')
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }

  const toggleDay = (day: string) => {
    setRecurringShiftForm((prev) => ({
      ...prev,
      dow: prev.dow.includes(day)
        ? prev.dow.filter((d) => d !== day)
        : [...prev.dow, day],
    }))
  }

  const toggleSector = (sectorId: string) => {
    setRecurringShiftForm((prev) => ({
      ...prev,
      sectorIds: prev.sectorIds.includes(sectorId)
        ? prev.sectorIds.filter((id) => id !== sectorId)
        : [...prev.sectorIds, sectorId],
    }))
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
              Operations
            </div>
            <a
              href="/ops"
              className="block px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Schedule
            </a>
            <a
              href="/admin"
              className="block px-3 py-2 rounded-md bg-slate-700 text-white font-medium"
            >
              Shift Management
            </a>
            <a
              href="/payroll"
              className="block px-3 py-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              Overtime Pay Extract
            </a>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Shift Management</h1>

          {/* Country Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
            <div className="flex gap-2">
              {(['FR', 'GB', 'SG'] as const).map((code) => (
                <button
                  key={code}
                  onClick={() => {
                    handleCountryChange(code)
                    setSectorForm((prev) => ({ ...prev, countryCode: code }))
                    setRecurringShiftForm((prev) => ({ ...prev, countryCode: code }))
                  }}
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

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : (
            <div className="space-y-8">
              {/* Sector Management */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Manage Sectors
                </h2>

                {/* Create Sector Form */}
                <form onSubmit={handleCreateSector} className="mb-6 pb-6 border-b border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sector Name
                      </label>
                      <input
                        type="text"
                        value={sectorForm.name}
                        onChange={(e) =>
                          setSectorForm({ ...sectorForm, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        Add Sector
                      </button>
                    </div>
                  </div>
                </form>

                {/* Sectors List */}
                <div className="space-y-2">
                  {sectors.length === 0 ? (
                    <p className="text-gray-500 text-sm">No sectors found</p>
                  ) : (
                    sectors.map((sector) => (
                      <div
                        key={sector.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100"
                      >
                        {editingSector?.id === sector.id ? (
                          <input
                            type="text"
                            defaultValue={sector.name}
                            onBlur={(e) => {
                              if (e.target.value !== sector.name) {
                                handleUpdateSector(sector, e.target.value)
                              } else {
                                setEditingSector(null)
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const newName = (e.target as HTMLInputElement).value
                                if (newName !== sector.name) {
                                  handleUpdateSector(sector, newName)
                                } else {
                                  setEditingSector(null)
                                }
                              } else if (e.key === 'Escape') {
                                setEditingSector(null)
                              }
                            }}
                            autoFocus
                            className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <span
                            className="flex-1 text-gray-900 font-medium cursor-pointer"
                            onClick={() => setEditingSector(sector)}
                          >
                            {sector.name}
                          </span>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingSector(sector)}
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => handleDeleteSector(sector.id)}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Shift Creation */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Create Shifts
                </h2>

                {/* Success Message */}
                {successMessage && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-800">{successMessage}</p>
                  </div>
                )}

                {/* Create Recurring Shift Form */}
                <form onSubmit={handleCreateRecurringShift}>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={recurringShiftForm.name}
                        onChange={(e) =>
                          setRecurringShiftForm({ ...recurringShiftForm, name: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={recurringShiftForm.type}
                        onChange={(e) =>
                          setRecurringShiftForm({
                            ...recurringShiftForm,
                            type: e.target.value as ShiftType,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      >
                        <option value="ONSITE">Onsite</option>
                        <option value="REMOTE">Remote</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={recurringShiftForm.start}
                        onChange={(e) =>
                          setRecurringShiftForm({ ...recurringShiftForm, start: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={recurringShiftForm.end}
                        onChange={(e) =>
                          setRecurringShiftForm({ ...recurringShiftForm, end: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Number of Engineers
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={recurringShiftForm.requiredCount}
                        onChange={(e) =>
                          setRecurringShiftForm({
                            ...recurringShiftForm,
                            requiredCount: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shift Type
                    </label>
                    <div className="flex gap-4 mb-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="shiftType"
                          value="recurring"
                          checked={recurringShiftForm.shiftType === 'recurring'}
                          onChange={(e) =>
                            setRecurringShiftForm({ ...recurringShiftForm, shiftType: 'recurring' })
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">Recurring</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="shiftType"
                          value="one-shot"
                          checked={recurringShiftForm.shiftType === 'one-shot'}
                          onChange={(e) =>
                            setRecurringShiftForm({ ...recurringShiftForm, shiftType: 'one-shot' })
                          }
                          className="w-4 h-4"
                        />
                        <span className="text-sm font-medium text-gray-700">One-shot</span>
                      </label>
                    </div>

                    {recurringShiftForm.shiftType === 'recurring' ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={recurringShiftForm.recurringStartDate}
                            onChange={(e) =>
                              setRecurringShiftForm({ ...recurringShiftForm, recurringStartDate: e.target.value })
                            }
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date (max 6 months from start)
                          </label>
                          <input
                            type="date"
                            value={recurringShiftForm.recurringEndDate}
                            onChange={(e) =>
                              setRecurringShiftForm({ ...recurringShiftForm, recurringEndDate: e.target.value })
                            }
                            min={recurringShiftForm.recurringStartDate || new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                            required
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={recurringShiftForm.oneShotDate}
                          onChange={(e) =>
                            setRecurringShiftForm({ ...recurringShiftForm, oneShotDate: e.target.value })
                          }
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                          required
                        />
                      </div>
                    )}
                  </div>

                  {recurringShiftForm.shiftType === 'recurring' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Days of Week
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {dayOptions.map((day) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              recurringShiftForm.dow.includes(day)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sectors (select which sectors this recurring shift applies to)
                    </label>
                    {sectors.length === 0 ? (
                      <p className="text-sm text-gray-500">No sectors available. Create sectors first.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {sectors.map((sector) => (
                          <button
                            key={sector.id}
                            type="button"
                            onClick={() => toggleSector(sector.id)}
                            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                              recurringShiftForm.sectorIds.includes(sector.id)
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {sector.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={creatingShift}
                    className={`px-4 py-2 bg-blue-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      creatingShift
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-blue-700'
                    }`}
                  >
                    {creatingShift ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Shift'
                    )}
                  </button>
                </form>
              </section>

              {/* Extend Period Modal */}
              {extendingShiftId && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Extend Recurring Shift</h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New End Date (max 6 months from current end date)
                      </label>
                      <input
                        type="date"
                        value={extendEndDate}
                        onChange={(e) => setExtendEndDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        required
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setExtendingShiftId(null)
                          setExtendEndDate('')
                        }}
                        className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleExtendPeriod}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Extend
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Recurring Shift Management */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Manage Recurring Shifts
                </h2>

                {/* Recurring Shifts List */}
                <div className="space-y-2">
                  {recurringShifts.length === 0 ? (
                    <p className="text-gray-500 text-sm">No recurring shifts found</p>
                  ) : (
                    recurringShifts.map((recurringShift) => {
                      const startDate = new Date(recurringShift.startDate).toLocaleDateString()
                      const endDate = new Date(recurringShift.endDate).toLocaleDateString()
                      const sectorNames = sectors
                        .filter(s => recurringShift.sectorIds.includes(s.id))
                        .map(s => s.name)
                        .join(', ')
                      
                      return (
                        <div
                          key={recurringShift.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{recurringShift.name}</div>
                            <div className="text-sm text-gray-600">
                              {recurringShift.start} - {recurringShift.end} | {recurringShift.type} |{' '}
                              {recurringShift.dow.length > 0 ? recurringShift.dow.join(', ') : 'One-shot'} | Engineers: {recurringShift.requiredCount}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Period: {startDate} - {endDate}
                            </div>
                            {sectorNames && (
                              <div className="text-xs text-gray-500 mt-1">
                                Sectors: {sectorNames}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleExtendClick(recurringShift)}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                            >
                              Extend
                            </button>
                            <button
                              onClick={() => handleDeleteRecurringShift(recurringShift.id)}
                              disabled={deletingShiftId === recurringShift.id}
                              className={`px-3 py-1 text-sm text-red-600 ${
                                deletingShiftId === recurringShift.id
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:text-red-800'
                              }`}
                            >
                              {deletingShiftId === recurringShift.id ? 'Deleting...' : 'End'}
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
