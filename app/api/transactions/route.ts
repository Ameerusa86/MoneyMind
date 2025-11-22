// app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import dbConnect from "@/lib/mongoose";
import Transaction from "@/lib/models/Transaction";
import Account from "@/lib/models/Account";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import type { TransactionType } from "@/lib/types";

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

// Keep in sync with import route
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

// GET /api/transactions
// ?type=expense&accountId=...&month=2025-09&limit=100&skip=0
export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);

    const type = searchParams.get("type"); // e.g. "expense"
    const accountId = searchParams.get("accountId"); // filter by account
    const month = searchParams.get("month"); // "YYYY-MM"
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "100", 10),
      500
    );
    const skip = parseInt(searchParams.get("skip") || "0", 10);

    const query: Record<string, unknown> = {
      userId: userId.toString(),
    };

    if (type) {
      query.type = type;
    }

    if (accountId) {
      // match either side of the transaction
      query.$or = [{ fromAccountId: accountId }, { toAccountId: accountId }];
    }

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      // date stored as "YYYY-MM-DD" string
      query.date = { $regex: `^${month}` };
    }

    const docs = await Transaction.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const result = docs.map((doc) => {
      const t = doc as unknown as LeanTransaction;
      return {
        id: t._id.toString(),
        userId: t.userId,
        type: t.type as TransactionType,
        fromAccountId: t.fromAccountId || undefined,
        toAccountId: t.toAccountId || undefined,
        amount: t.amount,
        date: t.date,
        description: t.description,
        category: t.category,
        metadata: t.metadata,
        createdAt: t.createdAt?.toISOString?.() ?? new Date().toISOString(),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// POST /api/transactions
// Used by the Expenses page to create a new expense transaction
export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
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
      type: TransactionType;
      amount: number;
      date: string;
      description?: string;
      category?: string;
      fromAccountId?: string;
      toAccountId?: string;
      metadata?: Record<string, unknown>;
    };

    if (
      !type ||
      typeof amount !== "number" ||
      !date ||
      (!fromAccountId && !toAccountId)
    ) {
      return errorResponse(
        "Missing required fields: type, amount, date, and at least one accountId",
        400
      );
    }

    // Optional: validate that referenced accounts belong to this user
    const accountIdsToCheck = [fromAccountId, toAccountId].filter(
      Boolean
    ) as string[];
    if (accountIdsToCheck.length > 0) {
      const accounts = await Account.find({
        _id: { $in: accountIdsToCheck },
        userId,
      });
      if (accounts.length !== accountIdsToCheck.length) {
        return errorResponse("Invalid account reference", 400);
      }
    }

    const userIdStr = userId.toString();
    const transactionKey = buildTransactionKey({
      userId: userIdStr,
      date,
      amount,
      description,
    });

    // Avoid exact duplicates if transactionKey exists
    if (transactionKey) {
      const existing = await Transaction.findOne({
        userId: userIdStr,
        transactionKey,
      }).lean();
      if (existing) {
        return errorResponse("Duplicate transaction", 409);
      }
    }

    const txn = await Transaction.create({
      userId: userIdStr,
      transactionKey,
      type,
      fromAccountId,
      toAccountId,
      amount,
      date,
      description,
      category,
      metadata: metadata || {},
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
