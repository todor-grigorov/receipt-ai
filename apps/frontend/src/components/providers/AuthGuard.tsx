"use client";

import { useIsAuthenticated } from "@azure/msal-react";
import { InteractionType } from "@azure/msal-browser";
import { useMsalAuthentication } from "@azure/msal-react";
import { loginRequest } from "@/lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useIsAuthenticated();

  useMsalAuthentication(InteractionType.Redirect, loginRequest);

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
