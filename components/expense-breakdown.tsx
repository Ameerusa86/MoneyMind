"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { ExpenseStorage } from "@/lib/storage";

const categoryColors: Record<string, string> = {
  Groceries: "#ef4444",
  Dining: "#f59e0b",
  Transportation: "#eab308",
  Utilities: "#3b82f6",
  Entertainment: "#8b5cf6",
  Healthcare: "#ec4899",
  Shopping: "#a855f7",
  Housing: "#06b6d4",
  Insurance: "#14b8a6",
  Debt: "#6366f1",
  Savings: "#10b981",
  Other: "#6b7280",
};

const categoryLabels: Record<string, string> = {
  groceries: "Groceries",
  dining: "Dining",
  transportation: "Transportation",
  utilities: "Utilities",
  entertainment: "Entertainment",
  healthcare: "Healthcare",
  shopping: "Shopping",
  housing: "Housing",
  insurance: "Insurance",
  debt: "Debt",
  savings: "Savings",
  other: "Other",
};

export function ExpenseBreakdown() {
  const [data, setData] = useState<
    Array<{ name: string; value: number; color: string }>
  >([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const now = new Date();
    const breakdown = ExpenseStorage.getCategoryBreakdown(
      now.getFullYear(),
      now.getMonth()
    );

    const chartData = Object.entries(breakdown)
      .map(([category, value]) => ({
        name: categoryLabels[category] || category,
        value,
        color:
          categoryColors[categoryLabels[category] || category] || "#6b7280",
      }))
      .sort((a, b) => b.value - a.value);

    setData(chartData);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Breakdown by Category</CardTitle>
      </CardHeader>
      <CardContent>
        {!isMounted ? (
          <div className="text-center py-8 text-muted-foreground h-[350px] flex items-center justify-center">
            Loading...
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground h-[350px] flex items-center justify-center">
            No expense data for this month yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent = 0 }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
