import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import Expense from "@/lib/models/Expense";
import Transaction from "@/lib/models/Transaction";
import dbConnect from "@/lib/mongoose";

// GET /api/expenses - List all expenses for authenticated user
export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const expenses = await Expense.find({ userId }).sort({ date: -1 }).lean();

    // Lookup linked transactions in one query by expenseId
    const expenseIds = expenses.map((e) =>
      (e as { _id: { toString: () => string } })._id.toString()
    );
    const txns = await Transaction.find({
      userId,
      type: "expense",
      "metadata.expenseId": { $in: expenseIds },
    })
      .select(["_id", "metadata.expenseId"]) // select minimal fields
      .lean();
    const txnByExpenseId = new Map<string, string>();
    for (const t of txns as unknown as Array<{
      _id: { toString: () => string };
      metadata?: { expenseId?: string };
    }>) {
      const eid = t.metadata?.expenseId;
      if (eid) txnByExpenseId.set(eid, t._id.toString());
    }

    // Convert MongoDB _id to id and include transactionId if linked
    const formattedExpenses = expenses.map((exp) => {
      const id = (exp as { _id: { toString: () => string } })._id.toString();
      return {
        id,
        userId: exp.userId,
        date: exp.date,
        amount: exp.amount,
        category: exp.category,
        accountId: exp.accountId,
        description: exp.description,
        createdAt: exp.createdAt.toISOString(),
        transactionId: txnByExpenseId.get(id),
      };
    });

    return NextResponse.json(formattedExpenses);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// POST /api/expenses - Create new expense
export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const body = await req.json();

    const expense = await Expense.create({
      userId,
      date: body.date,
      amount: body.amount,
      category: body.category,
      accountId: body.accountId,
      description: body.description,
    });

    // Auto-create a matching Transaction for daily credit card usage
    // Only if an accountId is provided (typically a credit card account)
    let createdTxnId: string | undefined;
    if (body.accountId) {
      const txn = await Transaction.create({
        userId,
        type: "expense",
        fromAccountId: body.accountId,
        amount: body.amount,
        date: body.date,
        description: body.description,
        category: body.category,
        metadata: { expenseId: expense._id.toString() },
      });
      createdTxnId = txn._id.toString();
    }

    return NextResponse.json(
      {
        id: expense._id.toString(),
        userId: expense.userId,
        date: expense.date,
        amount: expense.amount,
        category: expense.category,
        accountId: expense.accountId,
        description: expense.description,
        createdAt: expense.createdAt.toISOString(),
        // extra convenience field for clients that care
        transactionId: createdTxnId,
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
