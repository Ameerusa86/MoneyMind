"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { TransactionType } from "@/lib/types";
import { Plus, RefreshCcw, Link2 } from "lucide-react";

interface TransactionDto {
  id: string;
  type: TransactionType;
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  date: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface AccountDto {
  id: string;
  name: string;
  type?: string;
  balance?: number;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<TransactionDto[]>([]);
  const [expenses, setExpenses] = useState<TransactionDto[]>([]);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLinkRefundOpen, setIsLinkRefundOpen] = useState(false);
  const [linkTarget, setLinkTarget] = useState<TransactionDto | null>(null);

  const [createForm, setCreateForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    toAccountId: "",
    fromAccountId: "",
    isRefund: false,
    refundExpenseId: "",
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [payRes, expRes, accRes] = await Promise.all([
        fetch("/api/transactions?type=payment"),
        fetch("/api/transactions?type=expense"),
        fetch("/api/accounts"),
      ]);
      if (!payRes.ok) throw new Error("Failed to load payments");
      if (!expRes.ok) throw new Error("Failed to load expenses");
      if (!accRes.ok) throw new Error("Failed to load accounts");
      const payJson = (await payRes.json()) as TransactionDto[];
      const expJson = (await expRes.json()) as TransactionDto[];
      const accRaw = (await accRes.json()) as unknown[];
      const accJson: AccountDto[] = accRaw.map((raw) => {
        const a = raw as {
          id?: string;
          _id?: string;
          name: string;
          type?: string;
          balance?: number;
        };
        return {
          id: (a.id || a._id || "").toString(),
          name: a.name,
          type: a.type,
          balance: a.balance,
        };
      });
      // sort payments by date desc + createdAt desc
      payJson.sort((a, b) => {
        const d = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (d !== 0) return d;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      setPayments(payJson);
      setExpenses(expJson);
      setAccounts(accJson);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetCreate = () => {
    setCreateForm({
      amount: "",
      date: new Date().toISOString().split("T")[0],
      description: "",
      toAccountId: "",
      fromAccountId: "",
      isRefund: false,
      refundExpenseId: "",
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.amount || !createForm.date || !createForm.toAccountId) {
      alert("Amount, date, and destination account are required");
      return;
    }
    const amount = parseFloat(createForm.amount);
    const payload: Record<string, unknown> = {
      type: "payment",
      amount,
      date: createForm.date,
      description:
        createForm.description || (createForm.isRefund ? "Refund" : "Payment"),
      toAccountId: createForm.toAccountId,
    };
    if (createForm.fromAccountId)
      payload.fromAccountId = createForm.fromAccountId;
    if (createForm.isRefund && createForm.refundExpenseId) {
      payload.metadata = {
        refundFor: createForm.refundExpenseId,
        originalAmount: expenses.find(
          (e) => e.id === createForm.refundExpenseId
        )?.amount,
        partial:
          expenses.find((e) => e.id === createForm.refundExpenseId)?.amount !==
          amount,
      };
      if (!payload.description?.toString().toLowerCase().includes("refund")) {
        payload.description =
          `Refund: ${expenses.find((e) => e.id === createForm.refundExpenseId)?.description || ""}`.trim();
      }
    }
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create payment");
      resetCreate();
      setIsCreateOpen(false);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create payment");
    }
  };

  const openLinkRefund = (payment: TransactionDto) => {
    setLinkTarget(payment);
    setIsLinkRefundOpen(true);
  };

  const handleLinkRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkTarget || !createForm.refundExpenseId) return;
    try {
      const existingMeta = linkTarget.metadata || {};
      const expense = expenses.find((e) => e.id === createForm.refundExpenseId);
      const partial = expense ? expense.amount !== linkTarget.amount : false;
      const res = await fetch(`/api/transactions/${linkTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            ...existingMeta,
            refundFor: createForm.refundExpenseId,
            originalAmount: expense?.amount,
            partial,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to link refund");
      setIsLinkRefundOpen(false);
      setLinkTarget(null);
      setCreateForm((f) => ({ ...f, refundExpenseId: "" }));
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to link refund");
    }
  };

  const creditOrLoanAccounts = accounts.filter(
    (a) => a.type === "credit" || a.type === "loan"
  );
  const bankAccounts = accounts.filter(
    (a) => a.type === "checking" || a.type === "savings"
  );
  const recentExpensesForRefund = expenses
    .slice(0, 50)
    .filter(
      (e) =>
        e.fromAccountId &&
        creditOrLoanAccounts.find((a) => a.id === e.fromAccountId)
    ); // recent card charges

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">
            Record debt payments and refunds manually. A payment lowers debt
            (toAccount = credit/loan). Refunds are payments with a link back to
            the original expense.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCcw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Dialog
            open={isCreateOpen}
            onOpenChange={(o) => {
              setIsCreateOpen(o);
              if (!o) resetCreate();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> New Payment / Refund
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Payment / Refund</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount *</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={createForm.amount}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date *</label>
                  <Input
                    type="date"
                    value={createForm.date}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, date: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={createForm.description}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Optional description"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Debt Account (toAccount) *
                  </label>
                  <Select
                    value={createForm.toAccountId || undefined}
                    onValueChange={(v) =>
                      setCreateForm({ ...createForm, toAccountId: v })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select credit/loan" />
                    </SelectTrigger>
                    <SelectContent>
                      {creditOrLoanAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Source Bank (optional fromAccount)
                  </label>
                  <Select
                    value={createForm.fromAccountId || undefined}
                    onValueChange={(v) =>
                      setCreateForm({ ...createForm, fromAccountId: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Optional source" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Is Refund?</label>
                  <Select
                    value={createForm.isRefund ? "yes" : "no"}
                    onValueChange={(v) =>
                      setCreateForm({
                        ...createForm,
                        isRefund: v === "yes",
                        refundExpenseId:
                          v === "yes" ? createForm.refundExpenseId : "",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {createForm.isRefund && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Original Expense
                    </label>
                    <Select
                      value={createForm.refundExpenseId || undefined}
                      onValueChange={(v) =>
                        setCreateForm({ ...createForm, refundExpenseId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select expense" />
                      </SelectTrigger>
                      <SelectContent>
                        {recentExpensesForRefund.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {formatDate(new Date(e.date))} • {e.description} •{" "}
                            {formatCurrency(e.amount)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button type="submit" className="w-full">
                  Create
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading payments...
            </div>
          ) : payments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No payments recorded yet.
            </div>
          ) : (
            <ResponsiveTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Debt Account</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Refund</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => {
                    const debtAccount = p.toAccountId
                      ? accounts.find((a) => a.id === p.toAccountId)
                      : null;
                    const sourceAccount = p.fromAccountId
                      ? accounts.find((a) => a.id === p.fromAccountId)
                      : null;
                    const meta = p.metadata as
                      | Record<string, unknown>
                      | undefined;
                    const refundFor =
                      meta && typeof meta.refundFor === "string"
                        ? meta.refundFor
                        : null;
                    const originalExpense = refundFor
                      ? expenses.find((e) => e.id === refundFor)
                      : null;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>{formatDate(new Date(p.date))}</TableCell>
                        <TableCell
                          className="truncate max-w-[180px]"
                          title={p.description}
                        >
                          {p.description}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {debtAccount ? debtAccount.name : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sourceAccount ? sourceAccount.name : "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {formatCurrency(Math.abs(p.amount))}
                        </TableCell>
                        <TableCell className="text-right">
                          {refundFor && originalExpense ? (
                            <Badge
                              variant="outline"
                              className="max-w-[140px] truncate"
                              title={originalExpense.description}
                            >
                              Refund of {formatCurrency(originalExpense.amount)}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {!refundFor && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openLinkRefund(p)}
                            >
                              <Link2 className="h-4 w-4 mr-1" /> Link Refund
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>

      {/* Link Refund Dialog */}
      <Dialog
        open={isLinkRefundOpen}
        onOpenChange={(o) => {
          setIsLinkRefundOpen(o);
          if (!o) {
            setLinkTarget(null);
            setCreateForm((f) => ({ ...f, refundExpenseId: "" }));
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Payment as Refund</DialogTitle>
          </DialogHeader>
          {linkTarget && (
            <form onSubmit={handleLinkRefund} className="space-y-4 py-2">
              <div className="text-sm text-muted-foreground">
                Payment: {formatCurrency(linkTarget.amount)} •{" "}
                {linkTarget.description}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Original Expense *
                </label>
                <Select
                  value={createForm.refundExpenseId || undefined}
                  onValueChange={(v) =>
                    setCreateForm((f) => ({ ...f, refundExpenseId: v }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select expense" />
                  </SelectTrigger>
                  <SelectContent>
                    {recentExpensesForRefund.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {formatDate(new Date(e.date))} • {e.description} •{" "}
                        {formatCurrency(e.amount)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">
                Link Refund
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
