import {
  Configuration,
  PublicClientApplication,
  RedirectRequest,
  SilentRequest,
} from "@azure/msal-browser";

const msalConfig: Configuration = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID!,
    authority: `https://${process.env.NEXT_PUBLIC_AZURE_AD_TENANT_NAME}.ciamlogin.com`,
    redirectUri: process.env.NEXT_PUBLIC_AZURE_AD_REDIRECT_URI,
    postLogoutRedirectUri: process.env.NEXT_PUBLIC_AZURE_AD_REDIRECT_URI,
  },
  cache: {
    cacheLocation: "localStorage",
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

export const loginRequest: RedirectRequest = {
  scopes: ["openid", "profile", "email"],
};

export async function getAccessToken(): Promise<string> {
  const account = msalInstance.getActiveAccount();

  if (!account) throw new Error("No active account found");

  const silentRequest: SilentRequest = {
    scopes: ["openid", "profile", "email"],
    account,
  };

  const response = await msalInstance.acquireTokenSilent(silentRequest);
  return response.accessToken;
}

export async function signIn(): Promise<void> {
  await msalInstance.loginRedirect(loginRequest);
}

export async function signOut(): Promise<void> {
  await msalInstance.logoutRedirect({
    postLogoutRedirectUri: process.env.NEXT_PUBLIC_AZURE_AD_REDIRECT_URI,
  });
}
