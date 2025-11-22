// app/api/transactions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import dbConnect from "@/lib/mongoose";
import Transaction from "@/lib/models/Transaction";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import type { TransactionType } from "@/lib/types";

// Minimal lean transaction interface to avoid 'any'
interface LeanTransaction {
  _id: { toString(): string };
  userId: string;
  type: TransactionType;
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  date: string;
  description?: string;
  category?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

function buildTransactionKey(args: {
  userId: string;
  date: string;
  amount: number;
  description?: string;
}) {
  const raw = [
    args.userId,
    args.date.trim(),
    args.amount.toFixed(2),
    (args.description || "").trim().toLowerCase(),
  ].join("||");

  return crypto.createHash("sha256").update(raw).digest("hex");
}

// GET /api/transactions/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const { id } = await params;

    const txnDoc = await Transaction.findOne({
      _id: id,
      userId: userId.toString(),
    }).lean();
    if (!txnDoc) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    const txn = txnDoc as unknown as LeanTransaction;

    return NextResponse.json({
      id: txn._id.toString(),
      userId: txn.userId,
      type: txn.type as TransactionType,
      fromAccountId: txn.fromAccountId,
      toAccountId: txn.toAccountId,
      amount: txn.amount,
      date: txn.date,
      description: txn.description,
      category: txn.category,
      metadata: txn.metadata,
      createdAt: txn.createdAt?.toISOString?.() ?? new Date().toISOString(),
    });
  } catch (error) {
    console.error("GET /api/transactions/[id] error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// PUT /api/transactions/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const {
      type,
      amount,
      date,
      description,
      category,
      fromAccountId,
      toAccountId,
      metadata,
    } = body as {
      type?: TransactionType;
      amount?: number;
      date?: string;
      description?: string;
      category?: string;
      fromAccountId?: string;
      toAccountId?: string;
      metadata?: Record<string, unknown>;
    };

    const txnDoc = await Transaction.findOne({
      _id: id,
      userId: userId.toString(),
    });
    if (!txnDoc) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Cast for mutation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const txn = txnDoc as any;

    if (typeof amount === "number") txn.amount = amount;
    if (date) txn.date = date;
    if (type) txn.type = type;
    if (description !== undefined) txn.description = description;
    if (category !== undefined) txn.category = category;
    if (fromAccountId !== undefined) txn.fromAccountId = fromAccountId;
    if (toAccountId !== undefined) txn.toAccountId = toAccountId;
    if (metadata !== undefined) txn.metadata = metadata;

    // Rebuild transactionKey if any of its components changed
    const userIdStr = userId.toString();
    const newKey = buildTransactionKey({
      userId: userIdStr,
      date: txn.date,
      amount: txn.amount,
      description: txn.description,
    });
    txn.transactionKey = newKey;

    await txn.save();

    return NextResponse.json({
      id: txn._id.toString(),
      userId: txn.userId,
      type: txn.type as TransactionType,
      fromAccountId: txn.fromAccountId,
      toAccountId: txn.toAccountId,
      amount: txn.amount,
      date: txn.date,
      description: txn.description,
      category: txn.category,
      metadata: txn.metadata,
      createdAt: txn.createdAt.toISOString(),
    });
  } catch (error: unknown) {
    console.error("PUT /api/transactions/[id] error:", error);
    // Handle unique transactionKey conflicts
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: number }).code === 11000
    ) {
      return errorResponse(
        "Another transaction with same key already exists",
        409
      );
    }
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// DELETE /api/transactions/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const { id } = await params;

    const result = await Transaction.deleteOne({
      _id: id,
      userId: userId.toString(),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
