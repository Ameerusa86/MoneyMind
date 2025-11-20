"use client";

import { useEffect, useState } from "react";
import {
  getMonthlyExpenseTotals,
  getMonthlyIncomeTotals,
  getMonthlyCategoryBreakdown,
  getCurrentNetWorth,
  getSavingsRate,
  exportIncomeVsExpenseCSV,
  exportCategoryTrendsCSV,
} from "@/lib/reports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  PieChart,
  LineChart,
  Download,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";

const MONTH_WINDOW = 6;

export default function ReportsPage() {
  const [expenseTotals, setExpenseTotals] = useState<any[]>([]);
  const [incomeTotals, setIncomeTotals] = useState<any[]>([]);
  const [categorySeries, setCategorySeries] = useState<any[]>([]);
  const [netWorth, setNetWorth] = useState<{
    assets: number;
    liabilities: number;
    netWorth: number;
    savings: number;
  } | null>(null);
  const [savingsRate, setSavingsRate] = useState<number>(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setExpenseTotals(getMonthlyExpenseTotals(MONTH_WINDOW));
    setIncomeTotals(getMonthlyIncomeTotals(MONTH_WINDOW));
    setCategorySeries(getMonthlyCategoryBreakdown(MONTH_WINDOW));
    setNetWorth(getCurrentNetWorth());
    setSavingsRate(getSavingsRate());
  }, []);

  const incomeVsExpenseData = incomeTotals.map((inc, i) => ({
    month: inc.label,
    income: inc.value,
    expenses: expenseTotals[i]?.value || 0,
    net: inc.value - (expenseTotals[i]?.value || 0),
  }));

  // Derived metrics for Income vs Expenses
  const totalIncome = incomeVsExpenseData.reduce((s, r) => s + r.income, 0);
  const totalExpenses = incomeVsExpenseData.reduce((s, r) => s + r.expenses, 0);
  const totalNet = incomeVsExpenseData.reduce((s, r) => s + r.net, 0);
  const avgIncome = incomeVsExpenseData.length
    ? totalIncome / incomeVsExpenseData.length
    : 0;
  const avgExpenses = incomeVsExpenseData.length
    ? totalExpenses / incomeVsExpenseData.length
    : 0;
  const avgNet = incomeVsExpenseData.length
    ? totalNet / incomeVsExpenseData.length
    : 0;

  // Spending trends metrics
  const highestSpending = expenseTotals.reduce(
    (max, e) => (e.value > max.value ? e : max),
    { label: "-", value: 0 }
  );
  const avgSpending = expenseTotals.length
    ? expenseTotals.reduce((s, e) => s + e.value, 0) / expenseTotals.length
    : 0;
  const lastTwo = expenseTotals.slice(-2);
  const recentChange =
    lastTwo.length === 2 ? lastTwo[1].value - lastTwo[0].value : 0;

  // Category breakdown current month (last element)
  const latestCategories =
    categorySeries[categorySeries.length - 1]?.categoryTotals || {};
  const categoryTotalSum = Object.values(latestCategories).reduce(
    (s: number, v: number) => s + v,
    0
  );
  const topCategories = Object.entries(latestCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Transform category series for stacked view
  const allCategories = Array.from(
    new Set(categorySeries.flatMap((p) => Object.keys(p.categoryTotals)))
  );
  const categoryChartData = categorySeries.map((p) => ({
    month: p.label,
    ...allCategories.reduce((acc, c) => {
      acc[c] = p.categoryTotals[c] || 0;
      return acc;
    }, {} as Record<string, number>),
  }));

  function download(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportIncomeVsExpense() {
    const csv = exportIncomeVsExpenseCSV(MONTH_WINDOW);
    download("income_vs_expenses.csv", csv);
  }

  function exportCategoryTrends() {
    const csv = exportCategoryTrendsCSV(MONTH_WINDOW);
    download("category_trends.csv", csv);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Reports & Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Insights across income, spending, and net worth. Historical net worth
          will require future transaction snapshots.
        </p>
      </div>

      <Tabs defaultValue="income-expenses" className="space-y-6">
        <TabsList className="flex flex-wrap gap-2 bg-transparent p-0 mb-14 sm:mb-8">
          {[
            ["income-expenses", "Income vs Expenses"],
            ["spending", "Spending Trends"],
            ["categories", "Category Breakdown"],
            ["net-worth", "Net Worth"],
            ["savings", "Savings Rate"],
            ["export", "Export"],
          ].map(([val, label]) => (
            <TabsTrigger
              key={val}
              value={val}
              className="data-[state=active]:bg-blue-600/90 data-[state=active]:text-white data-[state=inactive]:bg-gray-900/60 data-[state=inactive]:text-gray-300 px-4 py-2 rounded-md text-sm font-medium shadow-sm hover:bg-blue-600/70 hover:text-white transition-colors border border-gray-700"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="income-expenses" className="space-y-6">
          <Card className="mt-8 sm:mt-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-blue-500" /> Income vs
                Expenses (Last {MONTH_WINDOW} Months)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-80">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <ReLineChart data={incomeVsExpenseData}>
                    <XAxis dataKey="month" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      formatter={(v: any) => formatCurrency(Number(v))}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      stroke="#ef4444"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="net"
                      stroke="#10b981"
                      strokeWidth={2}
                    />
                  </ReLineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricBox
              label="Total Income"
              value={totalIncome}
              color="text-blue-500"
            />
            <MetricBox
              label="Total Expenses"
              value={totalExpenses}
              color="text-rose-500"
            />
            <MetricBox
              label="Total Net"
              value={totalNet}
              color="text-emerald-500"
            />
            <MetricBox
              label="Avg Monthly Income"
              value={avgIncome}
              color="text-blue-400"
            />
            <MetricBox
              label="Avg Monthly Expenses"
              value={avgExpenses}
              color="text-rose-400"
            />
            <MetricBox
              label="Avg Monthly Net"
              value={avgNet}
              color="text-emerald-400"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Net is estimated using pay schedule typical amounts minus recorded
            expenses. Actual income tracking will refine these numbers in a
            future phase.
          </p>
        </TabsContent>

        <TabsContent value="spending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-rose-500" /> Monthly
                Expense Totals
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] sm:h-80">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={expenseTotals.map((e) => ({
                      month: e.label,
                      total: e.value,
                    }))}
                  >
                    <XAxis dataKey="month" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      formatter={(v: any) => formatCurrency(Number(v))}
                    />
                    <Bar dataKey="total" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricBox
              label="Highest Month"
              value={highestSpending.value}
              color="text-rose-500"
            />
            <MetricBox
              label="Average Monthly"
              value={avgSpending}
              color="text-rose-400"
            />
            <MetricBox
              label="Recent Change"
              value={recentChange}
              color={recentChange >= 0 ? "text-rose-300" : "text-emerald-400"}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Recent change compares the last two months. Negative indicates
            improvement (lower spending).
          </p>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-500" /> Category
                Breakdown (Stacked)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-80 sm:h-96">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData}>
                    <XAxis dataKey="month" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip
                      formatter={(v: any) => formatCurrency(Number(v))}
                    />
                    <Legend />
                    {allCategories.map((c, idx) => (
                      <Bar
                        key={c}
                        dataKey={c}
                        stackId="a"
                        fill={COLOR_PALETTE[idx % COLOR_PALETTE.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                Top Categories (Current Month)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topCategories.length === 0 && (
                <div className="text-sm text-gray-500">
                  No category data yet.
                </div>
              )}
              {topCategories.map(([cat, val]) => {
                const pct = categoryTotalSum
                  ? (val / categoryTotalSum) * 100
                  : 0;
                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="capitalize text-gray-300">{cat}</span>
                    <span className="text-gray-400">
                      {formatCurrency(val)} · {pct.toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Percentages represent each category's share of this month's total
            recorded expenses.
          </p>
        </TabsContent>

        <TabsContent value="net-worth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-500" /> Current Net
                Worth Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricBox
                label="Assets"
                value={netWorth?.assets || 0}
                color="text-blue-500"
              />
              <MetricBox
                label="Liabilities"
                value={netWorth?.liabilities || 0}
                color="text-red-500"
              />
              <MetricBox
                label="Savings"
                value={netWorth?.savings || 0}
                color="text-purple-500"
              />
              <MetricBox
                label="Net Worth"
                value={netWorth?.netWorth || 0}
                color="text-emerald-500"
              />
              <div className="md:col-span-4 text-xs text-gray-500 dark:text-gray-400">
                Historical tracking will be added once account balance history &
                transactions are implemented.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="savings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" /> Savings Rate
                (Current Month)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-green-600 dark:text-green-400">
                {((savingsRate || 0) * 100).toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Calculated as (Income - Expenses) / Income for current month.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-500" /> Export Reports
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Export aggregated analytics as CSV for spreadsheets or BI
                  tools. Columns are pre-formatted with two-decimal precision.
                  Additional formats (PDF, XLSX) will be added later.
                </p>
                <ul className="text-xs text-gray-500 list-disc pl-5 space-y-1">
                  <li>Income vs Expenses: Month, Income, Expenses, Net.</li>
                  <li>Category Trends: Month plus one column per category.</li>
                  <li>
                    Use in Excel / Google Sheets for deeper pivot analysis.
                  </li>
                </ul>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={exportIncomeVsExpense}>
                    Income vs Expenses CSV
                  </Button>
                  <Button variant="outline" onClick={exportCategoryTrends}>
                    Category Trends CSV
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-gray-900 border border-gray-800 flex flex-col gap-1">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className={`text-xl font-semibold ${color}`}>
        {formatCurrency(value)}
      </div>
    </div>
  );
}

const COLOR_PALETTE = [
  "#6366F1",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#84CC16",
  "#06B6D4",
  "#8B5CF6",
  "#F97316",
  "#2DD4BF",
  "#EF4444",
];
