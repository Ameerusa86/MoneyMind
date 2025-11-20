import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import PaySchedule from "@/lib/models/PaySchedule";
import dbConnect from "@/lib/mongoose";

// GET /api/pay-schedule - Get user's pay schedule
export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const schedule = await PaySchedule.findOne({ userId }).lean();

    if (!schedule) {
      return NextResponse.json(null);
    }

    const s = schedule as unknown as {
      _id: { toString: () => string };
      userId: string;
      frequency: string;
      nextPayDate: string;
      typicalAmount: number;
      createdAt: Date;
      updatedAt: Date;
    };
    return NextResponse.json({
      id: s._id.toString(),
      userId: s.userId,
      frequency: s.frequency,
      nextPayDate: s.nextPayDate,
      typicalAmount: s.typicalAmount,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// POST /api/pay-schedule - Create or update pay schedule
export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const body = await req.json();

    // Upsert (update if exists, create if not)
    const schedule = await PaySchedule.findOneAndUpdate(
      { userId },
      {
        userId,
        frequency: body.frequency,
        nextPayDate: body.nextPayDate,
        typicalAmount: body.typicalAmount,
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      id: schedule._id.toString(),
      userId: schedule.userId,
      frequency: schedule.frequency,
      nextPayDate: schedule.nextPayDate,
      typicalAmount: schedule.typicalAmount,
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// DELETE /api/pay-schedule - Delete pay schedule
export async function DELETE(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    await PaySchedule.deleteOne({ userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
