import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import PayPeriod from "@/lib/models/PayPeriod";
import dbConnect from "@/lib/mongoose";

export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const periods = await PayPeriod.find({ userId })
      .sort({ payDate: -1 })
      .lean();

    const formatted = periods.map((p) => ({
      id: (p as { _id: { toString: () => string } })._id.toString(),
      userId: p.userId,
      startDate: p.startDate,
      endDate: p.endDate,
      payDate: p.payDate,
      expectedAmount: p.expectedAmount,
      actualAmount: p.actualAmount,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
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

    const period = await PayPeriod.create({
      userId,
      startDate: body.startDate,
      endDate: body.endDate,
      payDate: body.payDate,
      expectedAmount: body.expectedAmount,
      actualAmount: body.actualAmount,
    });

    return NextResponse.json(
      {
        id: period._id.toString(),
        userId: period.userId,
        startDate: period.startDate,
        endDate: period.endDate,
        payDate: period.payDate,
        expectedAmount: period.expectedAmount,
        actualAmount: period.actualAmount,
        createdAt: period.createdAt.toISOString(),
        updatedAt: period.updatedAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
