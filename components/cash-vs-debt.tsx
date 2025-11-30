"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type {
  Account as AccountT,
  Transaction as TransactionT,
} from "@/lib/types";
import { calculateAccountBalances } from "@/lib/balance";

interface Point {
  month: string;
  cash: number;
  debt: number;
}

export function CashVsDebt() {
  const [accounts, setAccounts] = useState<AccountT[]>([]);
  const [transactions, setTransactions] = useState<TransactionT[]>([]);

  useEffect(() => {
    const load = async () => {
      const [accRes, txRes] = await Promise.all([
        fetch("/api/accounts", { cache: "no-store" }),
        fetch("/api/transactions?limit=1000", { cache: "no-store" }),
      ]);
      const accRaw = accRes.ok ? await accRes.json() : [];
      const txRaw = txRes.ok ? await txRes.json() : [];
      const accs: AccountT[] = accRaw.map((a: any) => ({
        id: (a.id || a._id || "").toString(),
        name: a.name,
        type: a.type,
        balance: a.balance,
        apr: a.apr,
        minPayment: a.minPayment,
        dueDay: a.dueDay,
        creditLimit: a.creditLimit,
        website: a.website,
        createdAt: new Date(a.createdAt).toISOString(),
        updatedAt: new Date(a.updatedAt).toISOString(),
      }));
      const txs: TransactionT[] = txRaw.map((t: any) => ({
        id: (t.id || t._id || "").toString(),
        userId: t.userId,
        type: t.type,
        fromAccountId: t.fromAccountId,
        toAccountId: t.toAccountId,
        amount: t.amount,
        date: t.date,
        description: t.description,
        category: t.category,
        metadata: t.metadata,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      }));
      setAccounts(accs);
      setTransactions(txs);
    };
    load();
  }, []);

  const data: Point[] = useMemo(() => {
    if (accounts.length === 0) return [];
    const now = new Date();
    const points: Point[] = [];
    for (let i = 5; i >= 0; i--) {
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const upToDate = end.toISOString();
      const balanceMap = calculateAccountBalances(
        accounts,
        transactions,
        upToDate
      );
      const cash = accounts
        .filter((a) => a.type === "checking" || a.type === "savings")
        .reduce((s, a) => s + (balanceMap.get(a.id) ?? a.balance), 0);
      const debt = accounts
        .filter((a) => a.type === "credit" || a.type === "loan")
        .reduce((s, a) => s + (balanceMap.get(a.id) ?? a.balance), 0);
      const month = end.toLocaleDateString("en-US", { month: "short" });
      points.push({ month, cash, debt });
    }
    return points;
  }, [accounts, transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash vs Debt (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] sm:h-[340px]" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="cash"
              stroke="#10b981"
              name="Cash"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="debt"
              stroke="#f59e0b"
              name="Debt"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
