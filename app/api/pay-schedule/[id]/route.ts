import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import PaySchedule from "@/lib/models/PaySchedule";
import dbConnect from "@/lib/mongoose";

// GET /api/pay-schedule/[id] - Get single pay schedule
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  const { id } = await params;

  try {
    await dbConnect();
    const schedule = await PaySchedule.findOne({ _id: id, userId }).lean();

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

    const s = schedule as unknown as {
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

    return NextResponse.json({
      id: s._id.toString(),
      userId: s.userId,
      frequency: s.frequency,
      nextPayDate: s.nextPayDate,
      typicalAmount: s.typicalAmount,
      depositAccountId: s.depositAccountId,
      owner: s.owner,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
}

// PUT /api/pay-schedule/[id] - Update pay schedule
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  const { id } = await params;

  try {
    await dbConnect();
    const body = await req.json();

    const schedule = await PaySchedule.findOneAndUpdate(
      { _id: id, userId },
      {
        frequency: body.frequency,
        nextPayDate: body.nextPayDate,
        typicalAmount: body.typicalAmount,
        depositAccountId: body.depositAccountId,
        owner: body.owner,
      },
      { new: true }
    );

    if (!schedule) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );
    }

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

// DELETE /api/pay-schedule/[id] - Delete pay schedule
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getAuthenticatedUser(req);
  if (!userId) return unauthorizedResponse();

  const { id } = await params;

  try {
    await dbConnect();
    const result = await PaySchedule.deleteOne({ _id: id, userId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Schedule not found" },
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
