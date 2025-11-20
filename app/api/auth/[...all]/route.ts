import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const a = await auth;
  return a.handler(req);
}

export async function POST(req: NextRequest) {
  const a = await auth;
  return a.handler(req);
}
