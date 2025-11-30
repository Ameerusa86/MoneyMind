"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TransactionType } from "@/lib/types";

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description?: string;
  category?: string;
}

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

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const fetchData = async () => {
      try {
        const res = await fetch("/api/transactions?limit=10", {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.slice(0, 6));
        }
      } catch (error) {
        console.error("Error fetching recent transactions:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {!isMounted ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transactions yet. Add or import transactions to see them here.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn) => {
                const isIncome = txn.type === "income_deposit";
                const isExpense = txn.type === "expense";
                const color = isIncome
                  ? "text-green-600 dark:text-green-400"
                  : isExpense
                    ? "text-red-600 dark:text-red-400"
                    : "text-blue-600 dark:text-blue-400";

                return (
                  <TableRow key={txn.id}>
                    <TableCell className="font-medium">
                      {formatDate(new Date(txn.date))}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="uppercase text-xs">
                        {txn.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{txn.description || "—"}</TableCell>
                    <TableCell>
                      {txn.category ? (
                        <Badge variant="secondary">
                          {categoryLabels[txn.category] || txn.category}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${color}`}>
                      {isIncome ? "+" : ""}
                      {formatCurrency(Math.abs(txn.amount))}
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
