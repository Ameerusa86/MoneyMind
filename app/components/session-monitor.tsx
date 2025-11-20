"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

/**
 * Session Monitor component
 * Checks session status periodically and redirects to login if expired
 */
export function SessionMonitor() {
  const router = useRouter();

  useEffect(() => {
    // Check session every minute
    const interval = setInterval(async () => {
      try {
        const { data: session } = authClient.useSession.getState
          ? authClient.useSession.getState()
          : { data: null };

        // If no session, redirect to login
        if (!session) {
          router.push("/login");
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    }, 60 * 1000); // Check every minute

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
