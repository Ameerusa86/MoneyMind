import mongoose, { Schema, Document } from "mongoose";
import type { AccountType } from "../types";

export interface IAccount extends Document {
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  apr?: number;
  minPayment?: number;
  dueDay?: number;
  creditLimit?: number;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["credit", "loan", "checking", "savings"],
      required: true,
    },
    balance: { type: Number, required: true },
    apr: { type: Number },
    minPayment: { type: Number },
    dueDay: { type: Number, min: 1, max: 31 },
    creditLimit: { type: Number },
    website: { type: String },
  },
  { timestamps: true }
);

AccountSchema.index({ userId: 1, type: 1 });

export default mongoose.models.Account ||
  mongoose.model<IAccount>("Account", AccountSchema);
