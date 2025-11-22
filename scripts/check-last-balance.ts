import dbConnect from "../lib/mongoose";
import Transaction from "../lib/models/Transaction";
import Account from "../lib/models/Account";

interface LeanTxn {
  _id: { toString(): string };
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  date: string;
  description?: string;
  metadata?: { runningBalance?: number; [k: string]: unknown };
}

interface LeanAccount {
  _id: { toString(): string };
  name: string;
  balance: number;
}

async function main() {
  await dbConnect();

  const accountDoc = await Account.findOne({ name: /Bank of America/i }).lean();
  const account = accountDoc as unknown as LeanAccount | null;
  if (!account) {
    console.log("Account not found!");
    process.exit(1);
  }

  const accountId = account._id.toString();

  const transactions = (await Transaction.find({
    $or: [{ fromAccountId: accountId }, { toAccountId: accountId }],
  })
    .sort({ date: 1 })
    .lean()) as unknown as LeanTxn[];

  console.log("=== FULL TRANSACTION HISTORY ===\n");
  console.log(`Account: Bank of America - Ameer`);
  console.log(`Account ID: ${accountId}\n`);

  console.log("Last 10 transactions (most recent):");
  console.log("=====================================");

  const last10 = transactions.slice(-10);
  for (const t of last10) {
    const direction = t.fromAccountId === accountId ? "OUT" : "IN";
    const amountStr = direction === "OUT" ? `-$${t.amount}` : `+$${t.amount}`;
    const balance = t.metadata?.runningBalance;
    console.log(
      `${t.date} | ${direction.padEnd(3)} | ${amountStr.padStart(12)} | Balance: $${balance ?? "?"}`
    );
    console.log(`  ${(t.description || "").substring(0, 80)}`);
  }

  // Check the very last transaction's running balance
  const lastTxn = transactions[transactions.length - 1];
  if (lastTxn && lastTxn.metadata?.runningBalance) {
    console.log(`\n\n=== ANSWER ===`);
    console.log(`The LAST transaction in your CSV (${lastTxn.date}) shows:`);
    console.log(`Running Balance: $${lastTxn.metadata.runningBalance}`);
    console.log(`\nThis should be your CURRENT balance in the bank!`);
    console.log(`Is this close to $33.93? If not, there's a discrepancy.`);
  }

  process.exit(0);
}

main();
