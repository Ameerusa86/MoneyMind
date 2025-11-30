import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  Landmark,
  DollarSign,
  PiggyBank,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionsWidget } from "@/components/transactions-widget";
import { SpendVsPaid } from "@/components/spend-vs-paid";
import { CashVsDebt } from "@/components/cash-vs-debt";
import { TransferDialog } from "@/components/transfer-dialog";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongoose";
import { Expense, Account, PaySchedule } from "@/lib/models";

// Ensure real-time data (disable caching/ISR)
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  // Server-side auth guard
  const a = await auth;
  const headersList = await headers();
  const session = await a.api.getSession({ headers: headersList });

  if (!session) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Compute stats server-side using direct MongoDB access
  await dbConnect();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  // Import Transaction model
  const { default: Transaction } = await import("@/lib/models/Transaction");

  const [accountsRaw, schedules, allTransactions] = await Promise.all([
    Account.find({ userId }).lean(),
    PaySchedule.find({ userId }).lean(),
    Transaction.find({ userId }).lean(),
  ]);

  // Import balance calculation
  const { calculateAccountBalances } = await import("@/lib/balance");

  // Convert to client format for balance calculation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accounts = accountsRaw.map((acc: any) => ({
    id: acc._id.toString(),
    name: acc.name,
    type: acc.type,
    balance: acc.balance,
    apr: acc.apr,
    minPayment: acc.minPayment,
    dueDay: acc.dueDay,
    creditLimit: acc.creditLimit,
    website: acc.website,
    createdAt: acc.createdAt.toISOString(),
    updatedAt: acc.updatedAt.toISOString(),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transactions = allTransactions.map((t: any) => ({
    id: t._id.toString(),
    userId: t.userId,
    type: t.type,
    fromAccountId: t.fromAccountId,
    toAccountId: t.toAccountId,
    amount: t.amount,
    date: t.date,
    description: t.description,
    category: t.category,
    metadata: t.metadata,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  // Calculate real-time balances
  const balanceMap = calculateAccountBalances(accounts, transactions);

  // Calculate total expenses from transactions this month
  // If no data for current month, show most recent month's data
  const currentMonthExpenses = transactions.filter(
    (t) =>
      t.type === "expense" &&
      new Date(t.date) >= monthStart &&
      new Date(t.date) <= monthEnd
  );

  const totalExpenses =
    currentMonthExpenses.length > 0
      ? currentMonthExpenses.reduce(
          (sum: number, t: any) => sum + Math.abs(t.amount),
          0
        )
      : transactions
          .filter((t) => t.type === "expense")
          .slice(0, 50)
          .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0);

  // Credit card debt: sum of all 'credit' type accounts (real-time)
  const creditCardDebt = accounts
    .filter((acc: any) => acc.type === "credit")
    .reduce((sum: number, acc: any) => {
      const calculatedBalance = balanceMap.get(acc.id) ?? acc.balance;
      return sum + calculatedBalance;
    }, 0);

  const totalLoans = accounts
    .filter((acc: any) => acc.type === "loan")
    .reduce((sum: number, acc: any) => {
      const calculatedBalance = balanceMap.get(acc.id) ?? acc.balance;
      return sum + calculatedBalance;
    }, 0);

  // Savings: only savings accounts (exclude checking for clarity)
  const savings = accounts
    .filter((acc: any) => acc.type === "savings")
    .reduce((sum: number, acc: any) => {
      const calculatedBalance = balanceMap.get(acc.id) ?? acc.balance;
      return sum + calculatedBalance;
    }, 0);

  // Checking cash: liquid funds in checking accounts
  const checkingCash = accounts
    .filter((acc: any) => acc.type === "checking")
    .reduce((sum: number, acc: any) => {
      const calculatedBalance = balanceMap.get(acc.id) ?? acc.balance;
      return sum + calculatedBalance;
    }, 0);

  // Calculate totals for this month
  const currentMonthIncome = transactions.filter(
    (t) =>
      t.type === "income_deposit" &&
      new Date(t.date) >= monthStart &&
      new Date(t.date) <= monthEnd
  );
  const currentMonthPayments = transactions.filter(
    (t) =>
      t.type === "payment" &&
      new Date(t.date) >= monthStart &&
      new Date(t.date) <= monthEnd
  );

  const totalIncome = currentMonthIncome.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0
  );
  const totalPayments = currentMonthPayments.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0
  );

  const stats = {
    spent: totalExpenses,
    paid: totalPayments,
    stillOwe: creditCardDebt + totalLoans,
    stillHave: checkingCash + savings,
  };

  // Determine display period
  const hasCurrentMonthData =
    currentMonthExpenses.length > 0 ||
    currentMonthIncome.length > 0 ||
    currentMonthPayments.length > 0;
  const displayPeriod = hasCurrentMonthData ? "This month" : "Recent";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Overview of your financial status
          </p>
        </div>
        <TransferDialog />
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(stats.spent)}
            </div>
            <p className="text-xs text-muted-foreground">{displayPeriod}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.paid)}
            </div>
            <p className="text-xs text-muted-foreground">{displayPeriod}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Still Have</CardTitle>
            <PiggyBank className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.stillHave)}
            </div>
            <p className="text-xs text-muted-foreground">
              Checking + Savings (real-time)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Still Owe</CardTitle>
            <Landmark className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(stats.stillOwe)}
            </div>
            <p className="text-xs text-muted-foreground">
              Credit + Loans (real-time)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="spend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="spend">Spend vs Paid</TabsTrigger>
          <TabsTrigger value="balances">Cash vs Debt</TabsTrigger>
        </TabsList>
        <TabsContent value="spend" className="space-y-4">
          <SpendVsPaid />
        </TabsContent>
        <TabsContent value="balances" className="space-y-4">
          <CashVsDebt />
        </TabsContent>
      </Tabs>

      {/* Recent Transactions with Filters */}
      <TransactionsWidget />
    </div>
  );
}
