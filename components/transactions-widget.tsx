"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Transaction as TransactionT, TransactionType } from "@/lib/types";

interface AccountDto {
  id: string;
  name: string;
}

type Period = "7" | "30" | "90";

export function TransactionsWidget() {
  const [transactions, setTransactions] = useState<TransactionT[]>([]);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [type, setType] = useState<"all" | TransactionType>("all");
  const [accountId, setAccountId] = useState<string>("all");
  const [period, setPeriod] = useState<Period>("30");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      const [txRes, accRes] = await Promise.all([
        fetch("/api/transactions?limit=500", { cache: "no-store" }),
        fetch("/api/accounts", { cache: "no-store" }),
      ]);
      const txRaw = txRes.ok ? await txRes.json() : [];
      const accRaw = accRes.ok ? await accRes.json() : [];
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
      const accs: AccountDto[] = accRaw.map((a: any) => ({
        id: (a.id || a._id || "").toString(),
        name: a.name,
      }));
      setTransactions(txs);
      setAccounts(accs);
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const days = Number(period);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return transactions
      .filter((t) => new Date(t.date) >= cutoff)
      .filter((t) => (type === "all" ? true : t.type === type))
      .filter((t) =>
        accountId !== "all"
          ? t.fromAccountId === accountId || t.toAccountId === accountId
          : true
      )
      .filter((t) =>
        query
          ? `${t.description || ""} ${t.category || ""}`
              .toLowerCase()
              .includes(query.toLowerCase())
          : true
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 12);
  }, [transactions, type, accountId, period, query]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-4">
          <div>
            <label className="text-xs text-muted-foreground">Type</label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="income_deposit">Income</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Account</label>
            <Select value={accountId} onValueChange={(v) => setAccountId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="All accounts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Period</label>
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as Period)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Search</label>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Description or category"
            />
          </div>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transactions for the selected filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const color =
                  t.type === "income_deposit"
                    ? "text-green-600 dark:text-green-400"
                    : t.type === "expense"
                      ? "text-red-600 dark:text-red-400"
                      : t.type === "payment"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-blue-600 dark:text-blue-400";
                return (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">
                      {formatDate(new Date(t.date))}
                    </TableCell>
                    <TableCell className="uppercase text-xs">
                      {t.type.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell
                      className="truncate max-w-[260px]"
                      title={t.description}
                    >
                      {t.description || "—"}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${color}`}>
                      {formatCurrency(Math.abs(t.amount))}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
