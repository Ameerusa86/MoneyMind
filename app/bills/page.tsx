"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BillStorage, AccountStorage, PayScheduleStorage } from "@/lib/storage";
import { Bill, BillRecurrence, Account, PaySchedule } from "@/lib/types";
import { Plus, Edit, Trash2, CalendarDays, RefreshCcw } from "lucide-react";

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [paySchedule, setPaySchedule] = useState<PaySchedule | null>(null);
  const [upcoming, setUpcoming] = useState<Bill[]>([]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [recurrence, setRecurrence] = useState<BillRecurrence>("monthly");
  const [linkedAccountId, setLinkedAccountId] = useState("");

  const loadAll = useCallback(async () => {
    const [savedBills, savedAccounts, schedule] = await Promise.all([
      BillStorage.getAll(),
      AccountStorage.getAll(),
      PayScheduleStorage.get(),
    ]);
    setBills(savedBills);
    setAccounts(savedAccounts);
    setPaySchedule(schedule);
  }, []);

  const resetForm = () => {
    setName("");
    setAmount("");
    setDueDay("");
    setRecurrence("monthly");
    setLinkedAccountId("");
    setEditingBill(null);
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setName(bill.name);
    setAmount(bill.amount?.toString() || "");
    setDueDay(bill.dueDay.toString());
    setRecurrence(bill.recurrence);
    setLinkedAccountId(bill.accountId || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this bill?")) {
      await BillStorage.delete(id);
      const updated = await BillStorage.getAll();
      setBills(updated);
    }
  };

  const handleSave = async () => {
    if (!name || !dueDay) {
      alert("Name and Due Day are required");
      return;
    }

    const billData = {
      name,
      amount: amount ? parseFloat(amount) : undefined,
      dueDay: parseInt(dueDay),
      recurrence,
      accountId: linkedAccountId || undefined,
    };

    if (editingBill) {
      await BillStorage.update(editingBill.id, billData);
    } else {
      await BillStorage.add(billData);
    }

    const updated = await BillStorage.getAll();
    setBills(updated);
    setIsDialogOpen(false);
    resetForm();
  };

  const togglePaid = async (billId: string) => {
    const bill = bills.find((b) => b.id === billId);
    if (!bill) return;

    await BillStorage.update(billId, { isPaid: !bill.isPaid });
    const updated = await BillStorage.getAll();
    setBills(updated);
  };

  const computeUpcoming = useCallback(() => {
    if (!paySchedule) {
      setUpcoming([]);
      return;
    }
    // Determine the next pay date window (today -> next pay date)
    const nextPayDate = new Date(paySchedule.nextPayDate);
    const today = new Date();
    const currentMonth = today.getMonth();
    const nextMonth = (currentMonth + 1) % 12;

    const billsInWindow = bills.filter((bill) => {
      // If due day remaining this month before next pay date OR in next month before next pay
      const dueThisMonth = new Date(
        today.getFullYear(),
        currentMonth,
        bill.dueDay
      );
      const dueNextMonth = new Date(
        today.getFullYear() + (nextMonth === 0 ? 1 : 0),
        nextMonth,
        bill.dueDay
      );

      // Consider only monthly bills for now; extend for other recurrence later
      if (bill.recurrence !== "monthly") return false;

      // Bill due before next pay day and not marked paid
      if (!bill.isPaid && dueThisMonth >= today && dueThisMonth <= nextPayDate)
        return true;
      if (!bill.isPaid && dueNextMonth <= nextPayDate && dueNextMonth >= today)
        return true;
      return false;
    });

    setUpcoming(billsInWindow.sort((a, b) => a.dueDay - b.dueDay));
  }, [bills, paySchedule]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    computeUpcoming();
  }, [computeUpcoming]);

  const getRecurrenceBadge = (r: BillRecurrence) => {
    const map: Record<BillRecurrence, string> = {
      weekly: "bg-blue-100 text-blue-800",
      "bi-weekly": "bg-indigo-100 text-indigo-800",
      monthly: "bg-green-100 text-green-800",
      quarterly: "bg-yellow-100 text-yellow-800",
      yearly: "bg-purple-100 text-purple-800",
    };
    return map[r];
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Bills & Due Dates</h1>
            <p className="text-muted-foreground">
              Track recurring bills and upcoming obligations ahead of your next
              paycheck.
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
                Add Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingBill ? "Edit Bill" : "Add New Bill"}
                </DialogTitle>
                <DialogDescription>
                  {editingBill
                    ? "Update bill details"
                    : "Add a new recurring bill"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bill Name *</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Internet, Car Insurance"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Due Day (1-31) *
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={dueDay}
                      onChange={(e) => setDueDay(e.target.value)}
                      placeholder="15"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Recurrence *</label>
                    <Select
                      value={recurrence}
                      onValueChange={(val) =>
                        setRecurrence(val as BillRecurrence)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Link to Account
                    </label>
                    <Select
                      value={linkedAccountId}
                      onValueChange={(val) => setLinkedAccountId(val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Optional" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSave} className="w-full">
                  {editingBill ? "Update Bill" : "Add Bill"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Upcoming Bills */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Before Next Pay</CardTitle>
              <CardDescription>
                {paySchedule
                  ? `Next pay date: ${new Date(
                      paySchedule.nextPayDate
                    ).toLocaleDateString()}`
                  : "Set your pay schedule in Income page"}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={computeUpcoming}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4">
                No upcoming unpaid bills in this pay window.
              </div>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="font-medium flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" /> {b.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Due Day {b.dueDay}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* All Bills */}
        <Card>
          <CardHeader>
            <CardTitle>All Bills</CardTitle>
            <CardDescription>Manage recurring obligations</CardDescription>
          </CardHeader>
          <CardContent>
            {bills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No bills yet. Add one to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bill</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Day</TableHead>
                    <TableHead>Recurrence</TableHead>
                    <TableHead>Linked Account</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bills.map((b) => {
                    const linked = accounts.find((a) => a.id === b.accountId);
                    return (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell>
                          {b.amount
                            ? `$${b.amount.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                              })}`
                            : "-"}
                        </TableCell>
                        <TableCell>Day {b.dueDay}</TableCell>
                        <TableCell>
                          <Badge className={getRecurrenceBadge(b.recurrence)}>
                            {b.recurrence}
                          </Badge>
                        </TableCell>
                        <TableCell>{linked ? linked.name : "-"}</TableCell>
                        <TableCell>
                          <Badge variant={b.isPaid ? "secondary" : "outline"}>
                            {b.isPaid ? "Paid" : "Unpaid"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(b)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePaid(b.id)}
                            >
                              {b.isPaid ? "Unmark" : "Mark Paid"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(b.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
