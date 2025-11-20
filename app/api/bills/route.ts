import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import Bill from "@/lib/models/Bill";
import dbConnect from "@/lib/mongoose";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const bills = await Bill.find({ userId }).sort({ dueDay: 1 }).lean();

    const formattedBills = bills.map((bill) => ({
      id: (bill as { _id: { toString: () => string } })._id.toString(),
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
    }));

    return NextResponse.json(formattedBills);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const body = await req.json();

    const bill = await Bill.create({
      userId,
      name: body.name,
      amount: body.amount,
      minAmount: body.minAmount,
      dueDay: body.dueDay,
      recurrence: body.recurrence,
      accountId: body.accountId,
      isPaid: body.isPaid,
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
