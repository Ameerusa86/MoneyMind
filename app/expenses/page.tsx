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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
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
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "" as ExpenseCategory | "",
    date: new Date().toISOString().split("T")[0],
    accountId: "",
  });

  /* ------------ Load data from APIs ------------ */

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [txRes, accRes] = await Promise.all([
        fetch("/api/transactions?type=expense"),
        fetch("/api/accounts"),
      ]);

      if (!txRes.ok) {
        const j = await txRes.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load expenses");
      }
      if (!accRes.ok) {
        const j = await accRes.json().catch(() => ({}));
        throw new Error(j.error || "Failed to load accounts");
      }

      const txJson = (await txRes.json()) as TransactionDto[];
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
      txJson.sort((a, b) => {
        const d = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (d !== 0) return d;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      setTransactions(txJson);
      setAccounts(accJson);
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

  /* ------------ Derived values - show all expenses ------------ */

  const now = new Date();
  const currentMonthExpenses = transactions.filter((t) => {
    const d = new Date(t.date + "T00:00:00");
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  });

  // If no data for current month, show most recent month
  const displayExpenses =
    currentMonthExpenses.length > 0
      ? currentMonthExpenses
      : transactions.slice(0, 50); // Show up to 50 most recent

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
  const displayPeriod =
    currentMonthExpenses.length > 0
      ? "This month"
      : transactions.length > 0
        ? "Recent"
        : "No data";

  /* ------------ Form handlers ------------ */

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "",
      date: new Date().toISOString().split("T")[0],
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

  /* ------------ UI ------------ */

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track and categorize all expense transactions (including CSV
            imports)
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
                displayExpenses.length > 0 && currentMonthExpenses.length > 0
                  ? totalExpenses / now.getDate()
                  : displayExpenses.length > 0
                    ? totalExpenses / Math.max(displayExpenses.length, 1)
                    : 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonthExpenses.length > 0 ? "Per day" : "Average"}
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
          <CardTitle>Expense Transactions</CardTitle>
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
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => {
                    const accountId = txn.fromAccountId || txn.toAccountId;
                    const account = accountId
                      ? accounts.find((a) => a.id === accountId) || null
                      : null;

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
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ResponsiveTable>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
