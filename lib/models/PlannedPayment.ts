import mongoose, { Schema, Document } from "mongoose";

export interface IPlannedPayment extends Document {
  userId: string;
  payPeriodId: string;
  accountId?: string;
  billId?: string;
  amount: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlannedPaymentSchema = new Schema<IPlannedPayment>(
  {
    userId: { type: String, required: true, index: true },
    payPeriodId: { type: String, required: true },
    accountId: { type: String },
    billId: { type: String },
    amount: { type: Number, required: true },
    note: { type: String },
  },
  { timestamps: true }
);

PlannedPaymentSchema.index({ userId: 1, payPeriodId: 1 });

export default mongoose.models.PlannedPayment ||
  mongoose.model<IPlannedPayment>("PlannedPayment", PlannedPaymentSchema);
