import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import Account from "@/lib/models/Account";
import dbConnect from "@/lib/mongoose";

// GET /api/accounts - List all accounts for authenticated user
export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const accounts = await Account.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const formattedAccounts = accounts.map((acc) => ({
      id: (acc as { _id: { toString: () => string } })._id.toString(),
      userId: acc.userId,
      name: acc.name,
      type: acc.type,
      balance: acc.balance,
      apr: acc.apr,
      minPayment: acc.minPayment,
      dueDay: acc.dueDay,
      creditLimit: acc.creditLimit,
      website: acc.website,
      createdAt: acc.createdAt.toISOString(),
      updatedAt: acc.updatedAt.toISOString(),
    }));

    return NextResponse.json(formattedAccounts);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// POST /api/accounts - Create new account
export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const body = await req.json();

    const account = await Account.create({
      userId,
      name: body.name,
      type: body.type,
      balance: body.balance,
      apr: body.apr,
      minPayment: body.minPayment,
      dueDay: body.dueDay,
      creditLimit: body.creditLimit,
      website: body.website,
    });

    return NextResponse.json(
      {
        id: account._id.toString(),
        userId: account.userId,
        name: account.name,
        type: account.type,
        balance: account.balance,
        apr: account.apr,
        minPayment: account.minPayment,
        dueDay: account.dueDay,
        creditLimit: account.creditLimit,
        website: account.website,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
