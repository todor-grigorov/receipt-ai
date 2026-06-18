'use client'

import { useEffect, useState } from 'react'
import { MsalProvider } from '@azure/msal-react'
import { msalInstance } from '@/lib/auth'
import { configureHttpClient } from '@/lib/configure'

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    msalInstance.initialize().then(() => {
      // Set active account if one exists in cache
      const accounts = msalInstance.getAllAccounts()
      if (accounts.length > 0) {
        msalInstance.setActiveAccount(accounts[0])
      }

      configureHttpClient()
      setIsInitialized(true)
    })
  }, [])

  if (!isInitialized) return null

  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>
}
