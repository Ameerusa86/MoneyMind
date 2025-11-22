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
import { RecentTransactions } from "@/components/recent-transactions";
import { MonthlyChart } from "@/components/monthly-chart";
import { ExpenseBreakdown } from "@/components/expense-breakdown";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongoose";
import { Expense, Account, PaySchedule } from "@/lib/models";

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

  // Calculate total income from actual deposits this month
  // If no data for current month, show most recent data
  const currentMonthIncome = transactions.filter(
    (t) =>
      t.type === "income_deposit" &&
      new Date(t.date) >= monthStart &&
      new Date(t.date) <= monthEnd
  );

  const totalIncome =
    currentMonthIncome.length > 0
      ? currentMonthIncome.reduce((sum, t) => sum + Math.abs(t.amount), 0)
      : transactions
          .filter((t) => t.type === "income_deposit")
          .slice(0, 50)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const stats = {
    totalIncome,
    totalExpenses,
    creditCardDebt,
    totalLoans,
    savings,
    checkingCash,
  };

  // Determine display period
  const hasCurrentMonthData =
    currentMonthExpenses.length > 0 || currentMonthIncome.length > 0;
  const displayPeriod = hasCurrentMonthData ? "This month" : "Recent";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of your financial status
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(stats.totalIncome)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {displayPeriod}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(stats.totalExpenses)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {displayPeriod}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(stats.totalIncome - stats.totalExpenses)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {displayPeriod}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Credit Card Debt
            </CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(stats.creditCardDebt)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Total outstanding
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              ● Real-time balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <Landmark className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(stats.totalLoans)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Remaining balance
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              ● Real-time balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings</CardTitle>
            <PiggyBank className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.savings)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Savings accounts
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              ● Real-time balance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checking Cash</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.checkingCash)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Checking accounts
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              ● Real-time balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expense Breakdown</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <MonthlyChart />
        </TabsContent>
        <TabsContent value="expenses" className="space-y-4">
          <ExpenseBreakdown />
        </TabsContent>
      </Tabs>

      {/* Recent Transactions */}
      <RecentTransactions />
    </div>
  );
}
