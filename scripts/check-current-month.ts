// Check transactions for current month
import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env.local" });

async function checkCurrentMonth() {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_APP_DB || "MoneyMindAccounts";

    if (!uri) {
      throw new Error("MONGODB_URI not found");
    }

    await mongoose.connect(uri, { dbName });
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const transactionsCollection = db!.collection("transactions");

    // Current month: November 2025
    const currentMonth = "2025-11";
    const docs = await transactionsCollection
      .find({
        date: { $regex: `^${currentMonth}` },
      })
      .toArray();

    console.log(`\nTransactions for ${currentMonth}: ${docs.length}`);

    if (docs.length > 0) {
      console.log("\nAll transactions:");
      docs.forEach((t, i) => {
        console.log(
          `${i + 1}. ${t.date} | ${t.type} | ${t.amount} | ${t.description}`
        );
      });
    }

    await mongoose.disconnect();
    console.log("\n✅ Done");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkCurrentMonth();
