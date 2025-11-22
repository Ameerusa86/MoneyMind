// Script to check transactions in the database
import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env.local" });

async function checkTransactions() {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_APP_DB || "MoneyMindAccounts";

    if (!uri) {
      throw new Error("MONGODB_URI not found in environment");
    }

    await mongoose.connect(uri, { dbName });
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const collections = await db!.listCollections().toArray();
    console.log(
      "Collections:",
      collections.map((c) => c.name)
    );

    // Check transactions collection
    const transactionsCollection =
      db!.collection<RawTransactionDoc>("transactions");
    const count = await transactionsCollection.countDocuments();
    console.log(`\nTotal transactions: ${count}`);

    if (count > 0) {
      const sample = await transactionsCollection.find({}).limit(5).toArray();
      console.log("\nSample transactions:");
      sample.forEach((t, i) => {
        console.log(`\n${i + 1}.`, {
          _id: t._id,
          userId: t.userId,
          type: t.type,
          amount: t.amount,
          date: t.date,
          description: t.description,
          category: t.category,
          hasTransactionKey: !!t.transactionKey,
        });
      });

      // Count by type
      const byType = await transactionsCollection
        .aggregate([
          {
            $group: {
              _id: "$type",
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();

      console.log("\nTransactions by type:");
      byType
        .filter((t) => t && typeof t._id === "string")
        .forEach((t) => {
          console.log(`  ${t._id}: ${t.count}`);
        });
    }

    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

interface RawTransactionDoc {
  _id: unknown;
  userId?: string;
  type?: string;
  amount?: number;
  date?: string;
  description?: string;
  category?: string;
  transactionKey?: string;
}

checkTransactions();
