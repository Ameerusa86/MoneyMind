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
import { ExpenseStorage } from "@/lib/storage";

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
    const now = new Date();
    const chartData: ChartData[] = [];

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      const expenses = ExpenseStorage.getByMonth(
        date.getFullYear(),
        date.getMonth()
      ).reduce((sum, e) => sum + e.amount, 0);

      chartData.push({
        month: monthName,
        income: 0, // TODO: Will be populated when income feature is implemented
        expenses,
      });
    }

    setData(chartData);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Income vs Expenses (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] sm:h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
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
