import mongoose, { Schema, Document } from "mongoose";
import type { PayFrequency } from "../types";

export interface IPaySchedule extends Document {
  userId: string;
  frequency: PayFrequency;
  nextPayDate: string;
  typicalAmount: number;
  depositAccountId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PayScheduleSchema = new Schema<IPaySchedule>(
  {
    userId: { type: String, required: true, index: true },
    frequency: {
      type: String,
      enum: ["weekly", "bi-weekly", "semi-monthly", "monthly"],
      required: true,
    },
    nextPayDate: { type: String, required: true },
    typicalAmount: { type: Number, required: true },
    depositAccountId: { type: String },
  },
  { timestamps: true }
);

// Ensure one pay schedule per user
PayScheduleSchema.index({ userId: 1 }, { unique: true });

export default mongoose.models.PaySchedule ||
  mongoose.model<IPaySchedule>("PaySchedule", PayScheduleSchema);
