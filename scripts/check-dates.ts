// Check all transaction dates
import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env.local" });

async function checkDates() {
  try {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_APP_DB || "MoneyMindAccounts";

    if (!uri) throw new Error("MONGODB_URI not found");

    await mongoose.connect(uri, { dbName });
    const db = mongoose.connection.db;
    const transactionsCollection = db!.collection("transactions");

    // Group by year-month
    const byMonth = await transactionsCollection
      .aggregate([
        {
          $addFields: {
            yearMonth: { $substr: ["$date", 0, 7] },
          },
        },
        {
          $group: {
            _id: "$yearMonth",
            count: { $sum: 1 },
            types: { $push: "$type" },
          },
        },
        {
          $sort: { _id: -1 },
        },
      ])
      .toArray();

    console.log("\nTransactions by month:");
    byMonth.forEach((m) => {
      const typeCounts: Record<string, number> = {};
      m.types.forEach((t: string) => {
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      });
      console.log(`\n${m._id}: ${m.count} total`);
      Object.entries(typeCounts).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
      });
    });

    await mongoose.disconnect();
    console.log("\n✅ Done");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkDates();
