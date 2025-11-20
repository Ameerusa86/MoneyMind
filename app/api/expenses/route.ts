import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import Expense from "@/lib/models/Expense";
import dbConnect from "@/lib/mongoose";

// GET /api/expenses - List all expenses for authenticated user
export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const expenses = await Expense.find({ userId }).sort({ date: -1 }).lean();

    // Convert MongoDB _id to id for consistency with localStorage format
    const formattedExpenses = expenses.map((exp) => ({
      id: (exp as { _id: { toString: () => string } })._id.toString(),
      userId: exp.userId,
      date: exp.date,
      amount: exp.amount,
      category: exp.category,
      accountId: exp.accountId,
      description: exp.description,
      createdAt: exp.createdAt.toISOString(),
    }));

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
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
