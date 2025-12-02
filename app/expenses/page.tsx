"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  TrendingDown,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Heart,
  Film,
  Trash2,
  Pencil,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatCurrency, formatDate, getTodayLocalDate } from "@/lib/utils";
import type { ExpenseCategory, TransactionType } from "@/lib/types";

type TransactionDto = {
  id: string;
  userId: string;
  type: TransactionType;
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  date: string; // "YYYY-MM-DD"
  description?: string;
  category?: ExpenseCategory;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

type AccountDto = {
  id: string;
  name: string;
  type?: string;
  balance?: number;
};

const categoryIcons: Record<ExpenseCategory, LucideIcon> = {
  groceries: ShoppingBag,
  dining: Utensils,
  transportation: Car,
  utilities: Home,
  entertainment: Film,
  healthcare: Heart,
  shopping: ShoppingBag,
  housing: Home,
  insurance: Heart,
  debt: TrendingDown,
  savings: TrendingDown,
  other: ShoppingBag,
};

const categoryLabels: Record<ExpenseCategory, string> = {
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

export default function ExpensesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  // Holds payment transactions with metadata.refundFor; kept only if we later surface details per refund
  // Currently unused beyond mapping; can remove if not needed
  const [refundPayments, setRefundPayments] = useState<TransactionDto[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [refundMap, setRefundMap] = useState<
    Record<string, { totalRefund: number; payments: TransactionDto[] }>
  >({});
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refundSaving, setRefundSaving] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  // AI suggestions state
  const [suggestions, setSuggestions] = useState<
    Record<
      string,
      {
        loading: boolean;
        category?: string;
        confidence?: number;
        method?: string;
        error?: string;
      }
    >
  >({});

  // Filter and sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<"date" | "amount" | "description">(
    "date"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "" as ExpenseCategory | "",
    date: getTodayLocalDate(),
    accountId: "",
  });

  // Refund dialog state
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundSourceTxn, setRefundSourceTxn] = useState<TransactionDto | null>(
    null
  );
  const [refundForm, setRefundForm] = useState({
    amount: "",
    date: getTodayLocalDate(),
    description: "",
    accountId: "",
  });

  /* ------------ Load data from APIs ------------ */

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [expenseRes, paymentRes, accRes] = await Promise.all([
        fetch("/api/transactions?type=expense"),
        fetch("/api/transactions?type=payment"),
        fetch("/api/accounts"),
      ]);

      if (!expenseRes.ok) {
        const j = await expenseRes.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load expenses");
      }
      if (!paymentRes.ok) {
        const j = await paymentRes.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load payments");
      }
      if (!accRes.ok) {
        const j = await accRes.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load accounts");
      }

      const expenseJson = (await expenseRes.json()) as TransactionDto[];
      const paymentJson = (await paymentRes.json()) as TransactionDto[];
      const accJsonRaw = (await accRes.json()) as unknown[];
      const accJson: AccountDto[] = (accJsonRaw || []).map((raw) => {
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

      // Sort by date desc, then createdAt desc
      expenseJson.sort((a, b) => {
        const d = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (d !== 0) return d;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
      setTransactions(expenseJson);
      setRefundPayments(
        paymentJson.filter(
          (p) => p.metadata && (p.metadata as Record<string, unknown>).refundFor
        )
      );
      setAccounts(accJson);

      // Build refund map from payment transactions referencing refundFor
      const map: Record<
        string,
        { totalRefund: number; payments: TransactionDto[] }
      > = {};
      for (const pay of paymentJson) {
        const meta = pay.metadata as Record<string, unknown> | undefined;
        const refFor =
          meta && typeof meta.refundFor === "string" ? meta.refundFor : null;
        if (refFor) {
          if (!map[refFor]) map[refFor] = { totalRefund: 0, payments: [] };
          map[refFor].totalRefund += Math.abs(pay.amount);
          map[refFor].payments.push(pay);
        }
      }
      setRefundMap(map);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ------------ Derived values - filter, sort, and search ------------ */

  const now = new Date();
  const currentMonthExpenses = transactions.filter((t) => {
    const d = new Date(t.date + "T00:00:00");
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  });

  // Apply filters and search
  let filteredExpenses = transactions.filter((txn) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesDescription = txn.description?.toLowerCase().includes(query);
      const matchesAmount = txn.amount.toString().includes(query);
      if (!matchesDescription && !matchesAmount) return false;
    }

    // Category filter
    if (categoryFilter !== "all") {
      if ((txn.category || "other") !== categoryFilter) return false;
    }

    // Account filter
    if (accountFilter !== "all") {
      const accountId = txn.fromAccountId || txn.toAccountId;
      if (accountId !== accountFilter) return false;
    }

    return true;
  });

  // Apply sorting
  filteredExpenses = [...filteredExpenses].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "date":
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case "amount":
        comparison = a.amount - b.amount;
        break;
      case "description":
        comparison = (a.description || "").localeCompare(b.description || "");
        break;
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  const displayExpenses = filteredExpenses;

  const totalExpenses = displayExpenses.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0
  );

  const categoryTotals = displayExpenses.reduce(
    (acc, txn) => {
      const cat: ExpenseCategory = txn.category || "other";
      const label = categoryLabels[cat];
      acc[label] = (acc[label] || 0) + Math.abs(txn.amount);
      return acc;
    },
    {} as Record<string, number>
  );

  // Determine display period
  const displayPeriod = transactions.length > 0 ? "All time" : "No data";

  /* ------------ Form handlers ------------ */

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "",
      date: getTodayLocalDate(),
      accountId: "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.description ||
      !formData.amount ||
      !formData.category ||
      !formData.date ||
      !formData.accountId
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        type: "expense" as TransactionType,
        amount: parseFloat(formData.amount),
        date: formData.date,
        description: formData.description,
        category: formData.category as ExpenseCategory,
        fromAccountId: formData.accountId,
      };

      if (editingId) {
        const res = await fetch(`/api/transactions/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || "Failed to update expense");
        }
      } else {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j.error || "Failed to create expense");
        }
      }

      resetForm();
      setIsDialogOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (txn: TransactionDto) => {
    const accountId = txn.fromAccountId || txn.toAccountId || "";

    setEditingId(txn.id);
    setFormData({
      description: txn.description || "",
      amount: txn.amount.toString(),
      category: (txn.category || "other") as ExpenseCategory,
      date: txn.date,
      accountId,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to delete expense");
      }
      await loadData();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to delete expense");
    }
  };

  // AI SUGGESTIONS
  const normalizeSuggestedCategory = (raw: string): ExpenseCategory => {
    switch (raw) {
      case "groceries":
      case "dining":
      case "utilities":
      case "entertainment":
        return raw;
      case "transport":
      case "transportation":
        return "transportation";
      case "medical":
      case "healthcare":
        return "healthcare";
      case "insurance":
        return "insurance";
      case "rent":
      case "housing":
        return "housing";
      case "clothing":
      case "shopping":
        return "shopping";
      case "debt":
      case "payment":
        return "debt";
      case "savings":
        return "savings";
      default:
        return "other";
    }
  };

  const handleSuggest = async (txn: TransactionDto) => {
    setSuggestions((s) => ({ ...s, [txn.id]: { loading: true } }));
    try {
      const res = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: txn.description,
          amount: txn.amount,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Suggest failed");
      }
      const data = (await res.json()) as {
        category: string;
        confidence: number;
        method: string;
      };
      setSuggestions((s) => ({
        ...s,
        [txn.id]: {
          loading: false,
          category: data.category,
          confidence: data.confidence,
          method: data.method,
        },
      }));
    } catch (err) {
      setSuggestions((s) => ({
        ...s,
        [txn.id]: {
          loading: false,
          error: err instanceof Error ? err.message : "Unknown error",
        },
      }));
    }
  };

  const handleAcceptSuggestion = async (txn: TransactionDto) => {
    const sug = suggestions[txn.id];
    if (!sug || !sug.category) return;
    const normalized = normalizeSuggestedCategory(sug.category);
    try {
      const res = await fetch(`/api/transactions/${txn.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: normalized }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Update failed");
      }
      await loadData();
      setSuggestions((s) => ({
        ...s,
        [txn.id]: { ...s[txn.id], category: undefined, confidence: undefined },
      }));
    } catch (err) {
      setSuggestions((s) => ({
        ...s,
        [txn.id]: {
          loading: false,
          error: err instanceof Error ? err.message : "Unknown error",
        },
      }));
    }
  };

  const handleDismissSuggestion = (id: string) => {
    setSuggestions((s) => ({ ...s, [id]: { loading: false } }));
  };

  // REFUND LOGIC
  const openRefundDialog = (txn: TransactionDto) => {
    setRefundSourceTxn(txn);
    setRefundForm({
      amount: txn.amount.toString(),
      date: getTodayLocalDate(),
      description: `Refund: ${txn.description || ""}`.trim(),
      accountId: txn.fromAccountId || "",
    });
    setRefundError(null);
    setIsRefundDialogOpen(true);
  };

  const resetRefundDialog = () => {
    setRefundSourceTxn(null);
    setRefundForm({
      amount: "",
      date: getTodayLocalDate(),
      description: "",
      accountId: "",
    });
    setRefundSaving(false);
    setRefundError(null);
  };

  const handleRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundSourceTxn) return;
    if (!refundForm.amount || !refundForm.date || !refundForm.accountId) {
      setRefundError("Please fill required fields");
      return;
    }
    // Guardrails: prevent duplicate or over-refunds for the same expense
    try {
      const amtGuard = parseFloat(refundForm.amount);
      const existing = refundMap[refundSourceTxn.id];
      const alreadyRefunded = existing?.totalRefund || 0;

      // Duplicate check: same amount refund already exists within 3 days window
      const hasSameAmountNearby = (existing?.payments || []).some((p) => {
        const sameAmount = Math.abs(p.amount - amtGuard) < 0.005;
        const daysApart =
          Math.abs(
            new Date(p.date).getTime() - new Date(refundForm.date).getTime()
          ) /
          (1000 * 60 * 60 * 24);
        return sameAmount && daysApart <= 3;
      });
      if (hasSameAmountNearby) {
        setRefundError(
          "A refund with the same amount already exists for this expense (within 3 days)."
        );
        return;
      }

      // Over-refund prevention
      if (
        alreadyRefunded + amtGuard >
        Math.abs(refundSourceTxn.amount) + 0.005
      ) {
        setRefundError(
          "This refund would exceed the original expense total. Adjust the amount."
        );
        return;
      }
    } catch (guardErr) {
      console.warn("Refund guard check failed:", guardErr);
      // Continue; guard is best-effort
    }
    setRefundSaving(true);
    setRefundError(null);
    try {
      const amt = parseFloat(refundForm.amount);
      const partial = amt !== refundSourceTxn.amount;
      const payload = {
        type: "payment",
        amount: amt,
        date: refundForm.date,
        description:
          refundForm.description ||
          `Refund: ${refundSourceTxn.description || ""}`.trim(),
        toAccountId: refundForm.accountId,
        metadata: {
          refundFor: refundSourceTxn.id,
          originalAmount: refundSourceTxn.amount,
          partial,
        },
      };
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to create refund");
      }
      resetRefundDialog();
      setIsRefundDialogOpen(false);
      await loadData();
    } catch (err) {
      setRefundError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRefundSaving(false);
    }
  };

  /* ------------ UI ------------ */

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track purchases and charges. Use Mark Refund when a merchant issues
            a credit. For debt payments or general card/loan payments go to the
            Payments page.
          </p>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Expense" : "Add New Expense"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <Input
                  placeholder="e.g., Grocery Shopping"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount *</label>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category *</label>
                <Select
                  value={formData.category || undefined}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      category: value as ExpenseCategory,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="groceries">Groceries</SelectItem>
                    <SelectItem value="dining">Dining</SelectItem>
                    <SelectItem value="transportation">
                      Transportation
                    </SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="housing">Housing</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="debt">Debt</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      date: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Account *</label>
                <Select
                  value={formData.accountId || undefined}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      accountId: value,
                    })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving
                  ? editingId
                    ? "Updating..."
                    : "Adding..."
                  : editingId
                    ? "Update Expense"
                    : "Add Expense"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Filter and Search Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search description or amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Account</label>
              <Select value={accountFilter} onValueChange={setAccountFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <div className="flex gap-2">
                <Select
                  value={sortField}
                  onValueChange={(value) =>
                    setSortField(value as "date" | "amount" | "description")
                  }
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                  }
                >
                  {sortDirection === "asc" ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Expenses
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-500">
              {formatCurrency(totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">{displayPeriod}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transaction Count
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{displayExpenses.length}</div>
            <p className="text-xs text-muted-foreground">{displayPeriod}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                currentMonthExpenses.length > 0
                  ? totalExpenses / now.getDate()
                  : 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonthExpenses.length > 0 ? "This month avg" : "N/A"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Largest Expense
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {formatCurrency(
                displayExpenses.length > 0
                  ? Math.max(...displayExpenses.map((t) => Math.abs(t.amount)))
                  : 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">Largest</p>
          </CardContent>
        </Card>
      </div>

      {/* Category breakdown cards */}
      {Object.entries(categoryTotals).length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 4)
            .map(([label, amount]) => {
              const key = Object.entries(categoryLabels).find(
                ([, v]) => v === label
              )?.[0] as ExpenseCategory | undefined;
              const Icon = (key && categoryIcons[key]) || ShoppingBag;

              return (
                <Card key={label}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {label}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(amount)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {totalExpenses > 0
                        ? ((amount / totalExpenses) * 100).toFixed(0)
                        : 0}
                      % of total
                    </p>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expense Transactions</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = "/payments")}
            >
              Go to Payments
            </Button>
            {(searchQuery ||
              categoryFilter !== "all" ||
              accountFilter !== "all") && (
              <p className="text-sm text-muted-foreground">
                Showing {displayExpenses.length} of {transactions.length}{" "}
                transactions
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading expenses...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No expense transactions yet. Import a CSV or click &quot;Add
              Expense&quot; to get started.
            </div>
          ) : (
            <ResponsiveTable>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 -ml-3"
                        onClick={() => {
                          if (sortField === "date") {
                            setSortDirection(
                              sortDirection === "asc" ? "desc" : "asc"
                            );
                          } else {
                            setSortField("date");
                            setSortDirection("desc");
                          }
                        }}
                      >
                        Date
                        {sortField === "date" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-1 h-3 w-3" />
                          ))}
                        {sortField !== "date" && (
                          <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 -ml-3"
                        onClick={() => {
                          if (sortField === "description") {
                            setSortDirection(
                              sortDirection === "asc" ? "desc" : "asc"
                            );
                          } else {
                            setSortField("description");
                            setSortDirection("asc");
                          }
                        }}
                      >
                        Description
                        {sortField === "description" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-1 h-3 w-3" />
                          ))}
                        {sortField !== "description" && (
                          <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 -mr-3"
                        onClick={() => {
                          if (sortField === "amount") {
                            setSortDirection(
                              sortDirection === "asc" ? "desc" : "asc"
                            );
                          } else {
                            setSortField("amount");
                            setSortDirection("desc");
                          }
                        }}
                      >
                        Amount
                        {sortField === "amount" &&
                          (sortDirection === "asc" ? (
                            <ArrowUp className="ml-1 h-3 w-3" />
                          ) : (
                            <ArrowDown className="ml-1 h-3 w-3" />
                          ))}
                        {sortField !== "amount" && (
                          <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    <TableHead className="text-right">AI</TableHead>
                    <TableHead className="text-right">Refund</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayExpenses.map((txn) => {
                    const accountId = txn.fromAccountId || txn.toAccountId;
                    const account = accountId
                      ? accounts.find((a) => a.id === accountId) || null
                      : null;
                    const refundInfo = refundMap[txn.id];
                    const refundedAmount = refundInfo?.totalRefund || 0;
                    const fullyRefunded =
                      refundedAmount >= Math.abs(txn.amount) - 0.009;
                    const partialRefund = refundedAmount > 0 && !fullyRefunded;

                    return (
                      <TableRow key={txn.id}>
                        <TableCell className="font-medium">
                          {formatDate(new Date(txn.date))}
                        </TableCell>
                        <TableCell>{txn.description}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {
                              categoryLabels[
                                (txn.category || "other") as ExpenseCategory
                              ]
                            }
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {account ? account.name : "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-rose-500">
                          {formatCurrency(Math.abs(txn.amount))}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(txn)}
                            >
                              <Pencil className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(txn.id)}
                            >
                              <Trash2 className="h-4 w-4 text-rose-500" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {(() => {
                            const sug = suggestions[txn.id];
                            const uncategorized =
                              !txn.category || txn.category === "other";
                            if (!uncategorized && !sug)
                              return (
                                <span className="text-xs text-muted-foreground">
                                  -
                                </span>
                              );
                            if (sug?.loading)
                              return (
                                <span className="text-xs">Suggesting...</span>
                              );
                            if (sug?.error)
                              return (
                                <div className="flex flex-col items-end gap-1">
                                  <span className="text-xs text-red-500">
                                    {sug.error}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSuggest(txn)}
                                  >
                                    Retry
                                  </Button>
                                </div>
                              );
                            if (sug?.category) {
                              return (
                                <div className="flex flex-col items-end gap-1">
                                  <Badge
                                    variant="outline"
                                    className="max-w-[110px] truncate"
                                  >
                                    {sug.category}{" "}
                                    {sug.confidence !== undefined &&
                                      `(${(sug.confidence * 100).toFixed(0)}%)`}
                                  </Badge>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() =>
                                        handleAcceptSuggestion(txn)
                                      }
                                    >
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() =>
                                        handleDismissSuggestion(txn.id)
                                      }
                                    >
                                      Dismiss
                                    </Button>
                                  </div>
                                </div>
                              );
                            }
                            return (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSuggest(txn)}
                              >
                                Suggest
                              </Button>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          {account?.type === "credit" ? (
                            fullyRefunded ? (
                              <Badge
                                className="bg-green-600 text-white"
                                variant="default"
                              >
                                Refunded
                              </Badge>
                            ) : partialRefund ? (
                              <div className="flex flex-col items-end gap-1">
                                <Badge
                                  className="bg-amber-500 text-white"
                                  variant="default"
                                >
                                  Partial {formatCurrency(refundedAmount)}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRefundDialog(txn)}
                                >
                                  Add Refund
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openRefundDialog(txn)}
                              >
                                Mark Refund
                              </Button>
                            )
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
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

      {/* Refund Dialog */}
      <Dialog
        open={isRefundDialogOpen}
        onOpenChange={(open) => {
          setIsRefundDialogOpen(open);
          if (!open) resetRefundDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {refundSourceTxn ? "Refund for Expense" : "Refund"}
            </DialogTitle>
          </DialogHeader>
          {refundError && <p className="text-sm text-red-500">{refundError}</p>}
          <form onSubmit={handleRefundSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount *</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={refundForm.amount}
                onChange={(e) =>
                  setRefundForm({ ...refundForm, amount: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date *</label>
              <Input
                type="date"
                value={refundForm.date}
                onChange={(e) =>
                  setRefundForm({ ...refundForm, date: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={refundForm.description}
                onChange={(e) =>
                  setRefundForm({ ...refundForm, description: e.target.value })
                }
                placeholder="Refund description"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Card Account *</label>
              <Select
                value={refundForm.accountId || undefined}
                onValueChange={(v) =>
                  setRefundForm({ ...refundForm, accountId: v })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select credit card" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a) => a.type === "credit")
                    .map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={refundSaving}>
              {refundSaving ? "Saving..." : "Create Refund"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
