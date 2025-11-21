"use client";

import { useEffect, useState } from "react";
import { authClient } from "./auth-client";
import { getDemoSession } from "./demo-auth";

export function useAuth() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      // Check demo session first
      const demoSession = getDemoSession();
      if (demoSession) {
        setSession(demoSession);
        setIsDemo(true);
        setLoading(false);
        return;
      }

      // Check regular auth
      try {
        const { data } = await authClient.getSession();
        setSession(data);
        setIsDemo(false);
      } catch (error) {
        setSession(null);
        setIsDemo(false);
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, []);

  return {
    session,
    user: session?.user || null,
    loading,
    isDemo,
    isAuthenticated: !!session,
  };
}
