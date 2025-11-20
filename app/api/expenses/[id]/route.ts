import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import Expense from "@/lib/models/Expense";
import dbConnect from "@/lib/mongoose";

// GET /api/expenses/[id] - Get single expense
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const expense = await Expense.findOne({ _id: params.id, userId }).lean();

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const exp = expense as unknown as {
      _id: { toString: () => string };
      userId: string;
      date: string;
      amount: number;
      category: string;
      accountId?: string;
      description?: string;
      createdAt: Date;
    };
    return NextResponse.json({
      id: exp._id.toString(),
      userId: exp.userId,
      date: exp.date,
      amount: exp.amount,
      category: exp.category,
      accountId: exp.accountId,
      description: exp.description,
      createdAt: exp.createdAt.toISOString(),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// PUT /api/expenses/[id] - Update expense
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const body = await req.json();

    const expense = await Expense.findOneAndUpdate(
      { _id: params.id, userId },
      {
        date: body.date,
        amount: body.amount,
        category: body.category,
        accountId: body.accountId,
        description: body.description,
      },
      { new: true }
    );

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: expense._id.toString(),
      userId: expense.userId,
      date: expense.date,
      amount: expense.amount,
      category: expense.category,
      accountId: expense.accountId,
      description: expense.description,
      createdAt: expense.createdAt.toISOString(),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const result = await Expense.deleteOne({ _id: params.id, userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
