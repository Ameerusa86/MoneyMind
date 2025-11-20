import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import PlannedPayment from "@/lib/models/PlannedPayment";
import dbConnect from "@/lib/mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const payment = await PlannedPayment.findOne({
      _id: params.id,
      userId,
    }).lean();

    if (!payment) {
      return NextResponse.json(
        { error: "Planned payment not found" },
        { status: 404 }
      );
    }

    const p = payment as unknown as {
      _id: { toString: () => string };
      userId: string;
      payPeriodId: string;
      accountId?: string;
      billId?: string;
      amount: number;
      note?: string;
      createdAt: Date;
    };
    return NextResponse.json({
      id: p._id.toString(),
      userId: p.userId,
      payPeriodId: p.payPeriodId,
      accountId: p.accountId,
      billId: p.billId,
      amount: p.amount,
      note: p.note,
      createdAt: p.createdAt.toISOString(),
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

    const payment = await PlannedPayment.findOneAndUpdate(
      { _id: params.id, userId },
      {
        payPeriodId: body.payPeriodId,
        accountId: body.accountId,
        billId: body.billId,
        amount: body.amount,
        note: body.note,
      },
      { new: true }
    );

    if (!payment) {
      return NextResponse.json(
        { error: "Planned payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: payment._id.toString(),
      userId: payment.userId,
      payPeriodId: payment.payPeriodId,
      accountId: payment.accountId,
      billId: payment.billId,
      amount: payment.amount,
      note: payment.note,
      createdAt: payment.createdAt.toISOString(),
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
    const result = await PlannedPayment.deleteOne({ _id: params.id, userId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Planned payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
