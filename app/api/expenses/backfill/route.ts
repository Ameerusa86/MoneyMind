import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import Expense from "@/lib/models/Expense";
import Transaction from "@/lib/models/Transaction";
import dbConnect from "@/lib/mongoose";

// GET /api/expenses/backfill - Preview count of expenses missing transactions
export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();

    const expenses = await Expense.find({ userId }).lean();
    const expenseIds = expenses.map((e) =>
      (e as { _id: { toString: () => string } })._id.toString()
    );

    const txns = await Transaction.find({
      userId,
      type: "expense",
      "metadata.expenseId": { $in: expenseIds },
    })
      .select(["_id", "metadata.expenseId"]) // minimal fields
      .lean();

    const linked = new Set<string>();
    for (const t of txns as unknown as Array<{
      metadata?: { expenseId?: string };
    }>) {
      if (t.metadata?.expenseId) linked.add(t.metadata.expenseId);
    }

    const missing = expenses.filter((e) => {
      const id = (e as { _id: { toString: () => string } })._id.toString();
      // Only backfill if expense has an accountId (a credit card)
      return e.accountId && !linked.has(id);
    });

    return NextResponse.json({
      total: expenses.length,
      missingCount: missing.length,
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// POST /api/expenses/backfill - Create missing transactions for expenses
export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();

    const expenses = await Expense.find({ userId }).lean();
    const expenseIds = expenses.map((e) =>
      (e as { _id: { toString: () => string } })._id.toString()
    );

    const existing = await Transaction.find({
      userId,
      type: "expense",
      "metadata.expenseId": { $in: expenseIds },
    })
      .select(["metadata.expenseId"]) // minimal fields
      .lean();

    const linked = new Set<string>();
    for (const t of existing as unknown as Array<{
      metadata?: { expenseId?: string };
    }>) {
      if (t.metadata?.expenseId) linked.add(t.metadata.expenseId);
    }

    let created = 0;
    for (const e of expenses) {
      const id = (e as { _id: { toString: () => string } })._id.toString();
      if (!e.accountId) continue; // need an account to backfill
      if (linked.has(id)) continue; // already has a txn

      await Transaction.create({
        userId,
        type: "expense",
        fromAccountId: e.accountId,
        amount: e.amount,
        date: e.date,
        description: e.description,
        category: e.category,
        metadata: { expenseId: id },
      });
      created += 1;
    }

    return NextResponse.json({ created });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
