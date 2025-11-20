import mongoose, { Schema, Document } from "mongoose";
import type { ExpenseCategory } from "../types";

export interface IExpense extends Document {
  userId: string;
  date: string;
  amount: number;
  category: ExpenseCategory;
  accountId?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    amount: { type: Number, required: true },
    category: {
      type: String,
      enum: [
        "groceries",
        "dining",
        "transportation",
        "utilities",
        "entertainment",
        "healthcare",
        "shopping",
        "housing",
        "insurance",
        "debt",
        "savings",
        "other",
      ],
      required: true,
    },
    accountId: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, category: 1 });

export default mongoose.models.Expense ||
  mongoose.model<IExpense>("Expense", ExpenseSchema);
