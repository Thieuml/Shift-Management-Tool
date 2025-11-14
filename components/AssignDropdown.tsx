'use client'

import { useState } from 'react'
import { useEngineers } from '@/lib/hooks'
import { assignShift, reassignShift, unassignShift } from '@/lib/api'
import { useSWRConfig } from 'swr'

interface AssignDropdownProps {
  shiftId: string
  currentEngineerId?: string
  countryCode: string
  sectorId: string
  plannedStart: string
  plannedEnd: string
  onAssign?: () => void
}

export function AssignDropdown({
  shiftId,
  currentEngineerId,
  countryCode,
  sectorId,
  plannedStart,
  plannedEnd,
  onAssign,
}: AssignDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { mutate } = useSWRConfig()

  // Fetch available engineers
  const { engineers, isLoading: engineersLoading } = useEngineers(
    countryCode,
    plannedStart,
    plannedEnd,
    sectorId
  )

  const handleAssign = async (engineerId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      if (currentEngineerId) {
        // Reassign if already assigned
        await reassignShift(shiftId, engineerId)
      } else {
        // Assign if not assigned
        await assignShift(shiftId, engineerId)
      }

      // Invalidate and refetch schedule and engineers data
      mutate((key) => typeof key === 'string' && (
        key.startsWith('/api/schedule') || key.startsWith('/api/engineers')
      ))
      
      setIsOpen(false)
      onAssign?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign engineer')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnassign = async () => {
    if (!currentEngineerId) return

    setIsLoading(true)
    setError(null)

    try {
      await unassignShift(shiftId, currentEngineerId)
      
      // Invalidate and refetch schedule and engineers data
      mutate((key) => typeof key === 'string' && (
        key.startsWith('/api/schedule') || key.startsWith('/api/engineers')
      ))
      
      setIsOpen(false)
      onAssign?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unassign engineer')
    } finally {
      setIsLoading(false)
    }
  }

  const currentEngineer = engineers.find((e: any) => e.id === currentEngineerId)
  const availableEngineers = engineers.filter((e: any) => {
    // Filter out engineers who already have assignments in this time range
    const hasConflict = e.assignments?.some(
      (assignment: any) =>
        assignment.shift.id !== shiftId &&
        new Date(assignment.shift.plannedStart) < new Date(plannedEnd) &&
        new Date(assignment.shift.plannedEnd) > new Date(plannedStart)
    )
    return !hasConflict || e.id === currentEngineerId
  })

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading || engineersLoading}
        className={`px-3 py-1.5 text-xs font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
          currentEngineer
            ? 'bg-green-50 text-gray-900 border border-green-200 hover:bg-green-100'
            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
        }`}
      >
        {isLoading ? (
          'Loading...'
        ) : currentEngineer ? (
          currentEngineer.name
        ) : (
          'Assign'
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200">
            <div className="py-1">
              {error && (
                <div className="px-4 py-2 text-sm text-red-600 bg-red-50">
                  {error}
                </div>
              )}

              {engineersLoading ? (
                <div className="px-4 py-2 text-sm text-gray-500">
                  Loading engineers...
                </div>
              ) : availableEngineers.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500">
                  No available engineers
                </div>
              ) : (
                <>
                  {currentEngineerId && (
                    <>
                      <button
                        onClick={handleUnassign}
                        disabled={isLoading}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Unassign
                      </button>
                      <div className="border-t border-gray-200" />
                    </>
                  )}
                  {availableEngineers.map((engineer: any) => (
                    <button
                      key={engineer.id}
                      onClick={() => handleAssign(engineer.id)}
                      disabled={isLoading || engineer.id === currentEngineerId}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                        engineer.id === currentEngineerId
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {engineer.name}
                      {engineer.id === currentEngineerId && ' (current)'}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

