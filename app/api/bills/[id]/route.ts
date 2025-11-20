import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import Bill from "@/lib/models/Bill";
import dbConnect from "@/lib/mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const bill = await Bill.findOne({ _id: params.id, userId }).lean();

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const b = bill as unknown as {
      _id: { toString: () => string };
      userId: string;
      name: string;
      amount?: number;
      minAmount?: number;
      dueDay: number;
      recurrence: string;
      accountId?: string;
      isPaid?: boolean;
      createdAt: Date;
      updatedAt: Date;
    };
    return NextResponse.json({
      id: b._id.toString(),
      userId: b.userId,
      name: b.name,
      amount: b.amount,
      minAmount: b.minAmount,
      dueDay: b.dueDay,
      recurrence: b.recurrence,
      accountId: b.accountId,
      isPaid: b.isPaid,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const body = await req.json();

    const bill = await Bill.findOneAndUpdate(
      { _id: params.id, userId },
      {
        name: body.name,
        amount: body.amount,
        minAmount: body.minAmount,
        dueDay: body.dueDay,
        recurrence: body.recurrence,
        accountId: body.accountId,
        isPaid: body.isPaid,
      },
      { new: true }
    );

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: bill._id.toString(),
      userId: bill.userId,
      name: bill.name,
      amount: bill.amount,
      minAmount: bill.minAmount,
      dueDay: bill.dueDay,
      recurrence: bill.recurrence,
      accountId: bill.accountId,
      isPaid: bill.isPaid,
      createdAt: bill.createdAt.toISOString(),
      updatedAt: bill.updatedAt.toISOString(),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const result = await Bill.deleteOne({ _id: params.id, userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
