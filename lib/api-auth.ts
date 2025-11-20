import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * Get authenticated user from request
 * Returns user ID or null if not authenticated
 */
export async function getAuthenticatedUser(req?: NextRequest) {
  try {
    const a = await auth;
    const headersList = await headers();
    const session = await a.api.getSession({ headers: headersList });

    if (!session || !session.user) {
      return null;
    }

    return session.user.id;
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}

/**
 * Return unauthorized response
 */
export function unauthorizedResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Return error response
 */
export function errorResponse(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}
