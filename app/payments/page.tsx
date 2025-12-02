"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import {
  Plus,
  RefreshCcw,
  Link2,
  Calendar,
  Pencil,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  Download,
} from "lucide-react";

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
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TransactionDto | null>(null);

  const [createForm, setCreateForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    toAccountId: "",
    fromAccountId: "",
    isRefund: false,
    refundExpenseId: "",
  });

  const [editForm, setEditForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    description: "",
    toAccountId: "",
    fromAccountId: "",
    isRefund: false,
    refundExpenseId: "",
  });

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<
    "all" | "today" | "week" | "month" | "custom"
  >("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [accountFilter, setAccountFilter] = useState<"all" | string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "regular" | "refund">(
    "all"
  );
  const [amountFilter, setAmountFilter] = useState<
    "all" | "small" | "medium" | "large"
  >("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "description">(
    "date"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

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

  // Filter, search and sort logic
  const getFilteredPayments = () => {
    let filtered = [...payments];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((payment) => {
        const description = payment.description?.toLowerCase() || "";
        const amount = payment.amount.toString();
        const fromAccount =
          accounts
            .find((a) => a.id === payment.fromAccountId)
            ?.name.toLowerCase() || "";
        const toAccount =
          accounts
            .find((a) => a.id === payment.toAccountId)
            ?.name.toLowerCase() || "";
        return (
          description.includes(query) ||
          amount.includes(query) ||
          fromAccount.includes(query) ||
          toAccount.includes(query)
        );
      });
    }

    // Date filter
    if (dateFilter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dateFilter === "today") {
        filtered = filtered.filter((p) => {
          const payDate = new Date(p.date);
          payDate.setHours(0, 0, 0, 0);
          return payDate.getTime() === today.getTime();
        });
      } else if (dateFilter === "week") {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter((p) => new Date(p.date) >= weekAgo);
      } else if (dateFilter === "month") {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = filtered.filter((p) => new Date(p.date) >= monthAgo);
      } else if (dateFilter === "custom" && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        filtered = filtered.filter((p) => {
          const date = new Date(p.date);
          return date >= start && date <= end;
        });
      }
    }

    // Account filter
    if (accountFilter !== "all") {
      filtered = filtered.filter(
        (p) =>
          p.fromAccountId === accountFilter || p.toAccountId === accountFilter
      );
    }

    // Type filter (regular vs refund)
    if (typeFilter !== "all") {
      filtered = filtered.filter((p) => {
        const isRefund = !!(p.metadata as Record<string, unknown>)?.refundFor;
        return typeFilter === "refund" ? isRefund : !isRefund;
      });
    }

    // Amount filter
    if (amountFilter !== "all") {
      filtered = filtered.filter((p) => {
        const amount = p.amount;
        if (amountFilter === "small") return amount < 50;
        if (amountFilter === "medium") return amount >= 50 && amount < 500;
        if (amountFilter === "large") return amount >= 500;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === "amount") {
        comparison = a.amount - b.amount;
      } else if (sortBy === "description") {
        comparison = (a.description || "").localeCompare(b.description || "");
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  };

  const filteredPayments = getFilteredPayments();

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const refundCount = filteredPayments.filter(
    (p) => !!(p.metadata as Record<string, unknown>)?.refundFor
  ).length;

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

    // Guardrails for refunds: prevent duplicates and over-refunds
    if (createForm.isRefund && createForm.refundExpenseId) {
      const expense = expenses.find(
        (ex) => ex.id === createForm.refundExpenseId
      );
      if (!expense) {
        alert("Original expense not found for refund");
        return;
      }
      const existing = payments.filter((p) => {
        const meta = (p.metadata || {}) as Record<string, unknown>;
        return meta && (meta.refundFor as string) === expense.id;
      });
      const alreadyRefunded = existing.reduce(
        (s, p) => s + Math.abs(p.amount),
        0
      );
      // Duplicate check within 3 days, same amount
      const hasSameAmountNearby = existing.some((p) => {
        const sameAmount = Math.abs(p.amount - amount) < 0.005;
        const daysApart =
          Math.abs(
            new Date(p.date).getTime() - new Date(createForm.date).getTime()
          ) /
          (1000 * 60 * 60 * 24);
        return sameAmount && daysApart <= 3;
      });
      if (hasSameAmountNearby) {
        alert(
          "A refund with the same amount already exists for this expense (within 3 days)."
        );
        return;
      }
      if (alreadyRefunded + amount > Math.abs(expense.amount) + 0.005) {
        alert(
          "This refund would exceed the original expense amount. Adjust the amount."
        );
        return;
      }
    }
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

  const openEdit = (payment: TransactionDto) => {
    setEditTarget(payment);
    const meta = (payment.metadata || {}) as Record<string, unknown>;
    const refundFor = typeof meta.refundFor === "string" ? meta.refundFor : "";
    setEditForm({
      amount: String(payment.amount ?? ""),
      date:
        payment.date?.slice(0, 10) || new Date().toISOString().split("T")[0],
      description: payment.description || "",
      toAccountId: payment.toAccountId || "",
      fromAccountId: payment.fromAccountId || "",
      isRefund: !!refundFor,
      refundExpenseId: refundFor,
    });
    setIsEditOpen(true);
  };

  const handleDelete = async (payment: TransactionDto) => {
    if (!confirm("Delete this payment? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/transactions/${payment.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete payment");
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete payment");
    }
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget) return;
    if (!editForm.amount || !editForm.date || !editForm.toAccountId) {
      alert("Amount, date, and destination account are required");
      return;
    }
    const amount = parseFloat(editForm.amount);

    // Guardrails for refunds on edit as well
    if (editForm.isRefund && editForm.refundExpenseId) {
      const expense = expenses.find((ex) => ex.id === editForm.refundExpenseId);
      if (!expense) {
        alert("Original expense not found for refund");
        return;
      }
      const existing = payments.filter((p) => {
        if (p.id === editTarget.id) return false; // exclude self
        const meta = (p.metadata || {}) as Record<string, unknown>;
        return meta && (meta.refundFor as string) === expense.id;
      });
      const alreadyRefunded = existing.reduce(
        (s, p) => s + Math.abs(p.amount),
        0
      );
      const hasSameAmountNearby = existing.some((p) => {
        const sameAmount = Math.abs(p.amount - amount) < 0.005;
        const daysApart =
          Math.abs(
            new Date(p.date).getTime() - new Date(editForm.date).getTime()
          ) /
          (1000 * 60 * 60 * 24);
        return sameAmount && daysApart <= 3;
      });
      if (hasSameAmountNearby) {
        alert(
          "A refund with the same amount already exists for this expense (within 3 days)."
        );
        return;
      }
      if (alreadyRefunded + amount > Math.abs(expense.amount) + 0.005) {
        alert(
          "This refund would exceed the original expense amount. Adjust the amount."
        );
        return;
      }
    }
    const payload: Record<string, unknown> = {
      amount,
      date: editForm.date,
      description: editForm.description || undefined,
      toAccountId: editForm.toAccountId || undefined,
      fromAccountId: editForm.fromAccountId || undefined,
    };
    if (editForm.isRefund) {
      if (!editForm.refundExpenseId) {
        alert("Select the original expense for this refund");
        return;
      }
      const expense = expenses.find((e) => e.id === editForm.refundExpenseId);
      payload.metadata = {
        ...(editTarget.metadata || {}),
        refundFor: editForm.refundExpenseId,
        originalAmount: expense?.amount,
        partial: expense ? expense.amount !== amount : true,
      };
      if (
        !(payload.description as string)?.toLowerCase?.().includes("refund")
      ) {
        payload.description =
          `Refund: ${expense?.description || editForm.description || ""}`.trim();
      }
    } else {
      // remove refund linkage
      payload.metadata = {};
    }

    try {
      const res = await fetch(`/api/transactions/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to update payment");
      setIsEditOpen(false);
      setEditTarget(null);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update payment");
    }
  };

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
          <Link href="/payday">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Payday Session
            </Button>
          </Link>
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

      {/* Filter and Search Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by description, amount, or account..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid gap-4 md:grid-cols-4">
            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select
                value={dateFilter}
                onValueChange={(v) => setDateFilter(v as typeof dateFilter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Account Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Account</label>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={typeFilter}
                onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="regular">Regular Payments</SelectItem>
                  <SelectItem value="refund">Refunds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount Range</label>
              <Select
                value={amountFilter}
                onValueChange={(v) => setAmountFilter(v as typeof amountFilter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Amounts</SelectItem>
                  <SelectItem value="small">{"< $50"}</SelectItem>
                  <SelectItem value="medium">$50 - $500</SelectItem>
                  <SelectItem value="large">{"> $500"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Date Range */}
          {dateFilter === "custom" && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Sort Controls */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select
                value={sortBy}
                onValueChange={(v) => setSortBy(v as typeof sortBy)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="description">Description</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Direction</label>
              <Select
                value={sortDirection}
                onValueChange={(v) => setSortDirection(v as "asc" | "desc")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Descending</SelectItem>
                  <SelectItem value="asc">Ascending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearchQuery("");
                  setDateFilter("all");
                  setAccountFilter("all");
                  setTypeFilter("all");
                  setAmountFilter("all");
                  setSortBy("date");
                  setSortDirection("desc");
                  setStartDate("");
                  setEndDate("");
                }}
              >
                Reset Filters
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="flex gap-4 p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Showing</p>
              <p className="text-2xl font-bold">{filteredPayments.length}</p>
              <p className="text-xs text-muted-foreground">
                of {payments.length} payments
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Refunds</p>
              <p className="text-2xl font-bold text-orange-600">
                {refundCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
          ) : filteredPayments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No payments match your filters. Try adjusting your search
              criteria.
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
                  {filteredPayments.map((p) => {
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
                          <div className="flex justify-end gap-2">
                            {!refundFor && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openLinkRefund(p)}
                              >
                                <Link2 className="h-4 w-4 mr-1" /> Refund
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(p)}
                            >
                              <Pencil className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(p)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          </div>
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

      {/* Edit Payment Dialog */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(o) => {
          setIsEditOpen(o);
          if (!o) {
            setEditTarget(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Payment</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount *</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) =>
                    setEditForm({ ...editForm, amount: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={editForm.date}
                  onChange={(e) =>
                    setEditForm({ ...editForm, date: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  placeholder="Optional description"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Debt Account (toAccount) *
                </label>
                <Select
                  value={editForm.toAccountId || undefined}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, toAccountId: v })
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
                  value={editForm.fromAccountId || undefined}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, fromAccountId: v })
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
                  value={editForm.isRefund ? "yes" : "no"}
                  onValueChange={(v) =>
                    setEditForm({
                      ...editForm,
                      isRefund: v === "yes",
                      refundExpenseId:
                        v === "yes" ? editForm.refundExpenseId : "",
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
              {editForm.isRefund && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Original Expense
                  </label>
                  <Select
                    value={editForm.refundExpenseId || undefined}
                    onValueChange={(v) =>
                      setEditForm({ ...editForm, refundExpenseId: v })
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
                Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
