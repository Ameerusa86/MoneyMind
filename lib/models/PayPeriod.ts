import mongoose, { Schema, Document } from "mongoose";

export interface IPayPeriod extends Document {
  userId: string;
  startDate: string;
  endDate: string;
  payDate: string;
  expectedAmount: number;
  actualAmount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PayPeriodSchema = new Schema<IPayPeriod>(
  {
    userId: { type: String, required: true, index: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    payDate: { type: String, required: true },
    expectedAmount: { type: Number, required: true },
    actualAmount: { type: Number },
  },
  { timestamps: true }
);

PayPeriodSchema.index({ userId: 1, payDate: -1 });

export default mongoose.models.PayPeriod ||
  mongoose.model<IPayPeriod>("PayPeriod", PayPeriodSchema);
