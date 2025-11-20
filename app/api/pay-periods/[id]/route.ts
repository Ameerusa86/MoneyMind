import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import PayPeriod from "@/lib/models/PayPeriod";
import dbConnect from "@/lib/mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const period = await PayPeriod.findOne({ _id: params.id, userId }).lean();

    if (!period) {
      return NextResponse.json(
        { error: "Pay period not found" },
        { status: 404 }
      );
    }

    const p = period as unknown as {
      _id: { toString: () => string };
      userId: string;
      startDate: string;
      endDate: string;
      payDate: string;
      expectedAmount: number;
      actualAmount?: number;
      createdAt: Date;
      updatedAt: Date;
    };
    return NextResponse.json({
      id: p._id.toString(),
      userId: p.userId,
      startDate: p.startDate,
      endDate: p.endDate,
      payDate: p.payDate,
      expectedAmount: p.expectedAmount,
      actualAmount: p.actualAmount,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
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

    const period = await PayPeriod.findOneAndUpdate(
      { _id: params.id, userId },
      {
        startDate: body.startDate,
        endDate: body.endDate,
        payDate: body.payDate,
        expectedAmount: body.expectedAmount,
        actualAmount: body.actualAmount,
      },
      { new: true }
    );

    if (!period) {
      return NextResponse.json(
        { error: "Pay period not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: period._id.toString(),
      userId: period.userId,
      startDate: period.startDate,
      endDate: period.endDate,
      payDate: period.payDate,
      expectedAmount: period.expectedAmount,
      actualAmount: period.actualAmount,
      createdAt: period.createdAt.toISOString(),
      updatedAt: period.updatedAt.toISOString(),
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
    const result = await PayPeriod.deleteOne({ _id: params.id, userId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Pay period not found" },
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
