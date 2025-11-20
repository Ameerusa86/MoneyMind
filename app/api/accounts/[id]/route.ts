import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import Account from "@/lib/models/Account";
import dbConnect from "@/lib/mongoose";

// GET /api/accounts/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const account = await Account.findOne({ _id: params.id, userId }).lean();

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const acc = account as unknown as {
      _id: { toString: () => string };
      userId: string;
      name: string;
      type: string;
      balance: number;
      apr?: number;
      minPayment?: number;
      dueDay?: number;
      creditLimit?: number;
      website?: string;
      createdAt: Date;
      updatedAt: Date;
    };
    return NextResponse.json({
      id: acc._id.toString(),
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
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// PUT /api/accounts/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const body = await req.json();

    const account = await Account.findOneAndUpdate(
      { _id: params.id, userId },
      {
        name: body.name,
        type: body.type,
        balance: body.balance,
        apr: body.apr,
        minPayment: body.minPayment,
        dueDay: body.dueDay,
        creditLimit: body.creditLimit,
        website: body.website,
      },
      { new: true }
    );

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// DELETE /api/accounts/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const result = await Account.deleteOne({ _id: params.id, userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
