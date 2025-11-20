import mongoose, { Schema, Document } from "mongoose";
import type { BillRecurrence } from "../types";

export interface IBill extends Document {
  userId: string;
  name: string;
  amount?: number;
  minAmount?: number;
  dueDay: number;
  recurrence: BillRecurrence;
  accountId?: string;
  isPaid?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BillSchema = new Schema<IBill>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    amount: { type: Number },
    minAmount: { type: Number },
    dueDay: { type: Number, required: true, min: 1, max: 31 },
    recurrence: {
      type: String,
      enum: ["weekly", "bi-weekly", "monthly", "quarterly", "yearly"],
      required: true,
    },
    accountId: { type: String },
    isPaid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

BillSchema.index({ userId: 1, dueDay: 1 });

export default mongoose.models.Bill ||
  mongoose.model<IBill>("Bill", BillSchema);
