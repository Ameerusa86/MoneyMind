"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  month: string;
  income: number;
  expenses: number;
}

export function MonthlyChart() {
  const [data, setData] = useState<ChartData[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchData = async () => {
      const now = new Date();
      const chartData: ChartData[] = [];

      // Generate last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString("en-US", { month: "short" });
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        // Fetch expenses
        const expenseRes = await fetch(
          `/api/transactions?type=expense&month=${monthStr}`
        );
        const expenses = expenseRes.ok
          ? (await expenseRes.json()).reduce(
              (sum: number, t: any) => sum + Math.abs(t.amount),
              0
            )
          : 0;

        // Fetch income
        const incomeRes = await fetch(
          `/api/transactions?type=income_deposit&month=${monthStr}`
        );
        const income = incomeRes.ok
          ? (await incomeRes.json()).reduce(
              (sum: number, t: any) => sum + Math.abs(t.amount),
              0
            )
          : 0;

        chartData.push({
          month: monthName,
          income,
          expenses,
        });
      }

      setData(chartData);
    };

    fetchData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs Expenses (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] sm:h-[340px]" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={isMounted ? data : []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value) => `$${value.toLocaleString()}`}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #ccc",
              }}
            />
            <Legend />
            <Bar dataKey="income" fill="#10b981" name="Income" />
            <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
