'use client'

import useSWR from 'swr'
import { fetcher } from './swr'

// Hook for fetching schedule
export function useSchedule(country: string, from: string, to: string) {
  const params = new URLSearchParams({ country, from, to })
  const { data, error, isLoading, mutate } = useSWR(
    country && from && to ? `/api/schedule?${params}` : null,
    fetcher
  )

  return {
    shifts: data?.shifts || [],
    isLoading,
    isError: error,
    mutate,
  }
}

// Hook for fetching engineers
export function useEngineers(
  country: string,
  start: string,
  end: string,
  sector?: string
) {
  const params = new URLSearchParams({ country, start, end })
  if (sector) {
    params.append('sector', sector)
  }
  
  const { data, error, isLoading, mutate } = useSWR(
    country && start && end ? `/api/engineers?${params}` : null,
    fetcher
  )

  return {
    engineers: data?.engineers || [],
    isLoading,
    isError: error,
    mutate,
  }
}

