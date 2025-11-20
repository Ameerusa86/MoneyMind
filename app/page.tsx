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

  const [expenses, accounts, schedule] = await Promise.all([
    Expense.find({
      userId,
      date: { $gte: monthStart.toISOString(), $lte: monthEnd.toISOString() },
    }).lean(),
    Account.find({ userId }).lean(),
    PaySchedule.findOne({ userId }).lean(),
  ]);

  const totalExpenses = expenses.reduce(
    (sum: number, exp: any) => sum + exp.amount,
    0
  );

  const creditCardDebt = accounts
    .filter((acc: any) => acc.type === "credit-card")
    .reduce((sum: number, acc: any) => sum + acc.balance, 0);

  const totalLoans = accounts
    .filter((acc: any) => acc.type === "loan")
    .reduce((sum: number, acc: any) => sum + acc.balance, 0);

  const savings = accounts
    .filter((acc: any) => acc.type === "checking" || acc.type === "savings")
    .reduce((sum: number, acc: any) => sum + acc.balance, 0);

  const totalIncome = (schedule as any)?.typicalAmount || 0;

  const stats = {
    totalIncome,
    totalExpenses,
    creditCardDebt,
    totalLoans,
    savings,
  };

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
              This month
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
              This month
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
              This month
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
              Total saved
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
