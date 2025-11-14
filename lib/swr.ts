import useSWR, { SWRConfiguration } from 'swr'

export const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    let errorMessage = `HTTP ${res.status}: ${res.statusText}`
    try {
      const errorData = await res.json()
      if (errorData.error) {
        errorMessage = errorData.error
        if (errorData.details) {
          errorMessage += ` - ${JSON.stringify(errorData.details)}`
        }
      }
    } catch {
      // If response is not JSON, use the status text
    }
    throw new Error(errorMessage)
  }
  return res.json()
}

export function useApi<T>(url: string | null, config?: SWRConfiguration<T>) {
  return useSWR<T>(url, fetcher, config)
}

