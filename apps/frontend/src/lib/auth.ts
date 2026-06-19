import {
  Configuration,
  PublicClientApplication,
  RedirectRequest,
  SilentRequest,
} from '@azure/msal-browser'

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID!,
    authority: `https://${process.env.NEXT_PUBLIC_AZURE_AD_TENANT_NAME}.ciamlogin.com/${process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID}/v2.0`,
    knownAuthorities: [
      `${process.env.NEXT_PUBLIC_AZURE_AD_TENANT_NAME}.ciamlogin.com`,
    ],
    redirectUri: process.env.NEXT_PUBLIC_AZURE_AD_REDIRECT_URI,
    postLogoutRedirectUri: process.env.NEXT_PUBLIC_AZURE_AD_REDIRECT_URI,
  },
  cache: {
    cacheLocation: 'localStorage',
  },
}

export const msalInstance = new PublicClientApplication(msalConfig)

const apiScope = `api://${process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID}/api.access`

export const loginRequest: RedirectRequest = {
  scopes: ['openid', 'profile', 'email'],
}

export async function getAccessToken(): Promise<string> {
  const accounts = msalInstance.getAllAccounts()
  if (accounts.length === 0) throw new Error('No active account found')

  if (!msalInstance.getActiveAccount()) {
    msalInstance.setActiveAccount(accounts[0])
  }

  const silentRequest: SilentRequest = {
    scopes: [apiScope], // ← only API scope here
    account: accounts[0],
  }

  const response = await msalInstance.acquireTokenSilent(silentRequest)
  return response.accessToken
}

export async function signIn(): Promise<void> {
  await msalInstance.loginRedirect(loginRequest)
}

export async function signOut(): Promise<void> {
  await msalInstance.logoutRedirect({
    postLogoutRedirectUri: process.env.NEXT_PUBLIC_AZURE_AD_REDIRECT_URI,
  })
}
