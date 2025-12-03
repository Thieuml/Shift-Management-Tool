'use client'

import { SessionProvider } from 'next-auth/react'
import { SWRConfig } from 'swr'
import { NovuProvider } from '@novu/react'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to fetch' }))
    throw new Error(error.error || 'Failed to fetch')
  }
  return res.json()
}

export function Providers({ children }: { children: React.ReactNode }) {
  const applicationIdentifier = process.env.NEXT_PUBLIC_NOVU_APP_ID
  
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
      }}
    >
      <SessionProvider>
        {children}
      </SessionProvider>
    </SWRConfig>
  )
}

