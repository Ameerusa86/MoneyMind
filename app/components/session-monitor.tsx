"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";

/**
 * Session Monitor component
 * Checks session status periodically and redirects to login if expired
 */
export function SessionMonitor() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Public routes that don't need auth
    const publicRoutes = ["/login", "/register", "/forgot-password"];
    const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

    // Don't check session on public routes
    if (isPublicRoute) {
      return;
    }

    // Check session every 2 minutes
    const interval = setInterval(async () => {
      try {
        const { data: session } = authClient.useSession.getState
          ? authClient.useSession.getState()
          : { data: null };

        // If no session and on protected route, redirect to login
        if (!session && !isPublicRoute) {
          router.push("/login");
        }
      } catch (error) {
        console.error("Session check error:", error);
      }
    }, 120 * 1000); // Check every 2 minutes

    return () => clearInterval(interval);
  }, [router, pathname]);

  return null;
}
