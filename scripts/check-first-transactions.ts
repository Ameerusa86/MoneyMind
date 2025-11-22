import dbConnect from "../lib/mongoose";
import Transaction from "../lib/models/Transaction";

interface LeanTxn {
  _id: { toString(): string };
  userId: string;
  type: string;
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  date: string;
  description?: string;
  category?: string;
  metadata?: { runningBalance?: number; [k: string]: unknown };
}

interface LeanAccount {
  _id: { toString(): string };
  name: string;
  balance: number;
}

async function main() {
  await dbConnect();

  const txns = (await Transaction.find({})
    .sort({ date: 1 })
    .limit(10)
    .lean()) as unknown as LeanTxn[];

  console.log("First 10 transactions (oldest first):");
  console.log("=====================================");

  for (const t of txns) {
    console.log(
      `${t.date} | ${t.type.padEnd(15)} | $${String(t.amount).padStart(10)} | ${t.description || "N/A"}`
    );
    console.log(
      `  from: ${t.fromAccountId || "none"} | to: ${t.toAccountId || "none"}`
    );
    console.log(`  metadata: ${JSON.stringify(t.metadata)}`);
    console.log("---");
  }

  // Get the Bank of America account
  const Account = (await import("../lib/models/Account")).default;
  const accountDoc = await Account.findOne({ name: /Bank of America/i }).lean();
  const account = accountDoc as unknown as LeanAccount | null;

  if (account) {
    console.log("\n\nBank of America Account:");
    console.log("========================");
    console.log(`Account ID: ${account._id.toString()}`);
    console.log(`Stored Balance: $${account.balance}`);

    // Get transactions for this account
    const accountTxns = (await Transaction.find({
      $or: [
        { fromAccountId: account._id.toString() },
        { toAccountId: account._id.toString() },
      ],
    })
      .sort({ date: 1 })
      .lean()) as unknown as LeanTxn[];

    console.log(`\nTotal transactions for this account: ${accountTxns.length}`);
    console.log("\nFirst 5 transactions for this account:");
    accountTxns.slice(0, 5).forEach((t) => {
      const direction =
        t.fromAccountId === account._id.toString() ? "OUT" : "IN";
      console.log(
        `${t.date} | ${direction} | ${t.type} | $${t.amount} | ${t.description}`
      );
    });
  }

  process.exit(0);
}

main();
