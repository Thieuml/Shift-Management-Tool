// API client functions

export async function assignShift(shiftId: string, engineerId: string) {
  const response = await fetch(`/api/shifts/${shiftId}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ engineerId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to assign shift')
  }

  return response.json()
}

export async function reassignShift(shiftId: string, engineerId: string) {
  const response = await fetch(`/api/shifts/${shiftId}/reassign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ engineerId }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to reassign shift')
  }

  return response.json()
}

export async function unassignShift(shiftId: string, engineerId?: string) {
  const response = await fetch(`/api/shifts/${shiftId}/unassign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(engineerId ? { engineerId } : {}),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to unassign shift')
  }

  return response.json()
}

