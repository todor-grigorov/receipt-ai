"use client";

import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest } from "@/lib/auth";
import { useEffect } from "react";

let loginInitiated = false;

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();

  useEffect(() => {
    if (
      inProgress === InteractionStatus.None &&
      !isAuthenticated &&
      !loginInitiated
    ) {
      loginInitiated = true;
      instance.loginRedirect(loginRequest).catch(console.error);
    }
  }, [inProgress, isAuthenticated, instance]);

  if (inProgress === InteractionStatus.None && !isAuthenticated) return null;
  if (inProgress !== InteractionStatus.None && !isAuthenticated) return null;

  return <>{children}</>;
}
