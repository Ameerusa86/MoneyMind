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
  spent: number;
  paid: number;
}

export function SpendVsPaid() {
  const [data, setData] = useState<ChartData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const now = new Date();
      const points: ChartData[] = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleDateString("en-US", { month: "short" });
        const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        const [expRes, payRes] = await Promise.all([
          fetch(`/api/transactions?type=expense&month=${monthStr}`, {
            cache: "no-store",
          }),
          fetch(`/api/transactions?type=payment&month=${monthStr}`, {
            cache: "no-store",
          }),
        ]);

        const expJson = expRes.ok ? await expRes.json() : [];
        const payJson = payRes.ok ? await payRes.json() : [];

        const spent = (expJson as Array<{ amount: number }>).reduce(
          (s, t) => s + Math.abs(t.amount),
          0
        );
        const paid = (payJson as Array<{ amount: number }>).reduce(
          (s, t) => s + Math.abs(t.amount),
          0
        );

        points.push({ month: monthName, spent, paid });
      }

      setData(points);
    };

    fetchData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spent vs Paid (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] sm:h-[340px]" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
            <Legend />
            <Bar dataKey="spent" fill="#ef4444" name="Spent" />
            <Bar dataKey="paid" fill="#10b981" name="Paid" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
