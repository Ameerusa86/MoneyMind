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
import { formatCurrency, formatDate } from "@/lib/utils";
import { ExpenseStorage, AccountStorage } from "@/lib/storage";
import type { Expense, ExpenseCategory } from "@/lib/types";

const categoryIcons: Record<ExpenseCategory, any> = {
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "" as ExpenseCategory | "",
    date: new Date().toISOString().split("T")[0],
    accountId: "",
  });

  // Load expenses on mount
  useEffect(() => {
    setIsMounted(true);
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    const allExpenses = await ExpenseStorage.getAll();
    // Sort by date descending
    allExpenses.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    setExpenses(allExpenses);
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

    if (editingId) {
      // Update existing expense
      await ExpenseStorage.update(editingId, {
        date: formData.date,
        amount: parseFloat(formData.amount),
        category: formData.category as ExpenseCategory,
        description: formData.description,
        accountId: formData.accountId,
      });
    } else {
      // Add new expense
      await ExpenseStorage.add({
        date: formData.date,
        amount: parseFloat(formData.amount),
        category: formData.category as ExpenseCategory,
        description: formData.description,
        accountId: formData.accountId,
      });
    }

    // Reset form and reload
    setFormData({
      description: "",
      amount: "",
      category: "",
      date: new Date().toISOString().split("T")[0],
      accountId: "",
    });
    setEditingId(null);
    setIsDialogOpen(false);
    await loadExpenses();
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setFormData({
      description: expense.description || "",
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      accountId: expense.accountId || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      await ExpenseStorage.delete(id);
      await loadExpenses();
    }
  };

  // State for current month's expenses and accounts
  const [currentMonthExpenses, setCurrentMonthExpenses] = useState<Expense[]>(
    []
  );
  const [accounts, setAccounts] = useState<any[]>([]);

  // Load current month data
  useEffect(() => {
    if (!isMounted) return;

    const loadMonthData = async () => {
      const now = new Date();
      const [monthExpenses, allAccounts] = await Promise.all([
        ExpenseStorage.getByMonth(now.getFullYear(), now.getMonth()),
        AccountStorage.getAll(),
      ]);
      setCurrentMonthExpenses(monthExpenses);
      setAccounts(allAccounts);
    };

    loadMonthData();
  }, [isMounted, expenses]);

  const totalExpenses = currentMonthExpenses.reduce(
    (sum, e) => sum + e.amount,
    0
  );

  const categoryTotals = currentMonthExpenses.reduce(
    (acc, expense) => {
      const label = categoryLabels[expense.category];
      acc[label] = (acc[label] || 0) + expense.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track and categorize your expenses
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingId(null);
              setFormData({
                description: "",
                amount: "",
                category: "",
                date: new Date().toISOString().split("T")[0],
                accountId: "",
              });
            }
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
                    setFormData({ ...formData, description: e.target.value })
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
                    setFormData({ ...formData, amount: e.target.value })
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
                    setFormData({ ...formData, date: e.target.value })
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
              <Button type="submit" className="w-full">
                {editingId ? "Update Expense" : "Add Expense"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        {Object.entries(categoryTotals)
          .slice(0, 2)
          .map(([category, amount]) => {
            const Icon =
              categoryIcons[category as keyof typeof categoryIcons] ||
              ShoppingBag;
            return (
              <Card key={category}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {category}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(amount)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {((amount / totalExpenses) * 100).toFixed(0)}% of total
                  </p>
                </CardContent>
              </Card>
            );
          })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No expenses yet. Click "Add Expense" to get started.
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
                  {expenses.map((expense) => {
                    const account = expense.accountId
                      ? accounts.find((a) => a.id === expense.accountId) || null
                      : null;
                    return (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">
                          {formatDate(new Date(expense.date))}
                        </TableCell>
                        <TableCell>{expense.description}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {categoryLabels[expense.category]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {account ? account.name : "-"}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-rose-500">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(expense)}
                            >
                              <Pencil className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(expense.id)}
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
