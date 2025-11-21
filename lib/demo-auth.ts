/**
 * Demo Authentication
 * Provides a test account that works without database access
 */

import { initializeDemoData } from "./demo-data";

const DEMO_USER = {
  email: "test@test.com",
  password: "Test123456",
  id: "demo-user-123",
  name: "Demo User",
};

const DEMO_SESSION_KEY = "demo_session";

export function isDemoUser(email: string): boolean {
  return email.toLowerCase() === DEMO_USER.email.toLowerCase();
}

export function validateDemoCredentials(
  email: string,
  password: string
): boolean {
  return (
    email.toLowerCase() === DEMO_USER.email.toLowerCase() &&
    password === DEMO_USER.password
  );
}

export function createDemoSession() {
  const session = {
    user: {
      id: DEMO_USER.id,
      email: DEMO_USER.email,
      name: DEMO_USER.name,
    },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
    // Initialize demo data on first login
    initializeDemoData();
  }

  return session;
}

export function getDemoSession() {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(DEMO_SESSION_KEY);
  if (!stored) return null;

  try {
    const session = JSON.parse(stored);
    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(DEMO_SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearDemoSession() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(DEMO_SESSION_KEY);
  }
}

export function isDemoMode(): boolean {
  return getDemoSession() !== null;
}
