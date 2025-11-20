import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import PlannedPayment from "@/lib/models/PlannedPayment";
import dbConnect from "@/lib/mongoose";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const payments = await PlannedPayment.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    const formatted = payments.map((p) => ({
      id: (p as { _id: { toString: () => string } })._id.toString(),
      userId: p.userId,
      payPeriodId: p.payPeriodId,
      accountId: p.accountId,
      billId: p.billId,
      amount: p.amount,
      note: p.note,
      createdAt: p.createdAt.toISOString(),
    }));

    return NextResponse.json(formatted);
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

    const payment = await PlannedPayment.create({
      userId,
      payPeriodId: body.payPeriodId,
      accountId: body.accountId,
      billId: body.billId,
      amount: body.amount,
      note: body.note,
    });

    return NextResponse.json(
      {
        id: payment._id.toString(),
        userId: payment.userId,
        payPeriodId: payment.payPeriodId,
        accountId: payment.accountId,
        billId: payment.billId,
        amount: payment.amount,
        note: payment.note,
        createdAt: payment.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
