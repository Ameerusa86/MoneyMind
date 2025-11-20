import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import PaySchedule from "@/lib/models/PaySchedule";
import dbConnect from "@/lib/mongoose";

// GET /api/pay-schedule - Get all user's pay schedules
export async function GET(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const schedules = await PaySchedule.find({ userId }).lean();

    const formatted = schedules.map((s) => {
      const schedule = s as unknown as {
        _id: { toString: () => string };
        userId: string;
        frequency: string;
        nextPayDate: string;
        typicalAmount: number;
        depositAccountId?: string;
        owner?: string;
        createdAt: Date;
        updatedAt: Date;
      };
      return {
        id: schedule._id.toString(),
        userId: schedule.userId,
        frequency: schedule.frequency,
        nextPayDate: schedule.nextPayDate,
        typicalAmount: schedule.typicalAmount,
        depositAccountId: schedule.depositAccountId,
        owner: schedule.owner,
        createdAt: schedule.createdAt.toISOString(),
        updatedAt: schedule.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// POST /api/pay-schedule - Create new pay schedule
export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    const body = await req.json();

    const schedule = await PaySchedule.create({
      userId,
      frequency: body.frequency,
      nextPayDate: body.nextPayDate,
      typicalAmount: body.typicalAmount,
      depositAccountId: body.depositAccountId,
      owner: body.owner,
    });

    return NextResponse.json({
      id: schedule._id.toString(),
      userId: schedule.userId,
      frequency: schedule.frequency,
      nextPayDate: schedule.nextPayDate,
      typicalAmount: schedule.typicalAmount,
      depositAccountId: schedule.depositAccountId,
      owner: schedule.owner,
      createdAt: schedule.createdAt.toISOString(),
      updatedAt: schedule.updatedAt.toISOString(),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// DELETE /api/pay-schedule - Delete all pay schedules (rarely used)
export async function DELETE(req: NextRequest) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  try {
    await dbConnect();
    await PaySchedule.deleteMany({ userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}
