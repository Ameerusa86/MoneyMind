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
  balance: number;
  name: string;
}

async function main() {
  await dbConnect();

  // Get the Bank of America account
  const accountDoc = await Account.findOne({ name: /Bank of America/i }).lean();
  const account = accountDoc as unknown as LeanAccount | null;

  if (!account) {
    console.log("Account not found!");
    process.exit(1);
  }

  const accountId = account._id.toString();

  // Get ALL transactions for this account, sorted by date
  const transactions = (await Transaction.find({
    $or: [{ fromAccountId: accountId }, { toAccountId: accountId }],
  })
    .sort({ date: 1 })
    .lean()) as unknown as LeanTxn[];

  console.log("=== Balance Calculation Analysis ===\n");
  console.log(`Total transactions: ${transactions.length}\n`);
  console.log(`Current stored opening balance: $${account.balance}\n`);

  // Find the first transaction's running balance
  const firstTxn = transactions[0];
  if (firstTxn && firstTxn.metadata && firstTxn.metadata.runningBalance) {
    console.log(`First transaction (${firstTxn.date}):`);
    console.log(`  Description: ${firstTxn.description}`);
    console.log(
      `  Running Balance in CSV: $${firstTxn.metadata.runningBalance}`
    );

    // Calculate what the balance SHOULD be after all transactions
    let calculatedBalance = account.balance;

    for (const t of transactions) {
      if (t.toAccountId === accountId) {
        // Money coming in
        calculatedBalance += t.amount;
      } else if (t.fromAccountId === accountId) {
        // Money going out
        calculatedBalance -= t.amount;
      }
    }

    console.log(`\n=== With current opening balance ($${account.balance}) ===`);
    console.log(`Calculated current balance: $${calculatedBalance.toFixed(2)}`);

    // Now calculate what opening balance SHOULD be to match current reality
    // If current actual balance is $33.93, work backwards
    const currentActualBalance = 33.93;
    let workingBalance = currentActualBalance;

    // Go through transactions in REVERSE
    for (let i = transactions.length - 1; i >= 0; i--) {
      const t = transactions[i];
      if (t.toAccountId === accountId) {
        // This was money IN, so subtract it to go back in time
        workingBalance -= t.amount;
      } else if (t.fromAccountId === accountId) {
        // This was money OUT, so add it back to go back in time
        workingBalance += t.amount;
      }
    }

    console.log(
      `\n=== To match current actual balance ($${currentActualBalance}) ===`
    );
    console.log(`Opening balance SHOULD be: $${workingBalance.toFixed(2)}`);
    console.log(
      `\nThis means if you set opening balance to $${workingBalance.toFixed(2)},`
    );
    console.log(
      `the current balance will calculate to $${currentActualBalance}`
    );
  }

  process.exit(0);
}

main();
