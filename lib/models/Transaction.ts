import mongoose, { Schema, Document } from "mongoose";
import type { TransactionType } from "../types";

export interface ITransaction extends Document {
  userId: string;
  type: TransactionType;
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  date: string; // store as "YYYY-MM-DD" string
  description?: string;
  category?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    // userId indexed via compound indexes below; avoid duplicate single-field index
    userId: { type: String, required: true },
    type: {
      type: String,
      enum: ["income_deposit", "payment", "expense", "transfer", "adjustment"],
      required: true,
    },
    fromAccountId: { type: String, index: true },
    toAccountId: { type: String, index: true },
    amount: { type: Number, required: true },
    date: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1 });
TransactionSchema.index({ userId: 1, fromAccountId: 1 });
TransactionSchema.index({ userId: 1, toAccountId: 1 });

export default mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
