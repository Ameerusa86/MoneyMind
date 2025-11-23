"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  PayScheduleStorage,
  AccountStorage,
  BillStorage,
  PlannedPaymentStorage,
} from "@/lib/storage";
import { Account, Bill, PaySchedule, PlannedPayment } from "@/lib/types";

function currency(n: number) {
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function isoDateOnly(d: string) {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function PaymentPlannerPage() {
  const [paySchedule, setPaySchedule] = useState<PaySchedule | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [allPlanned, setAllPlanned] = useState<PlannedPayment[]>([]);

  // Derived identifiers
  const payPeriodId = useMemo(
    () => (paySchedule ? isoDateOnly(paySchedule.nextPayDate) : null),
    [paySchedule]
  );

  // Derived: upcoming bills before next pay (monthly only, aligned with Bills page logic)
  const upcomingBills = useMemo(() => {
    if (!paySchedule) return [] as Bill[];
    const nextPayDate = new Date(paySchedule.nextPayDate);
    const today = new Date();
    const currentMonth = today.getMonth();
    const nextMonth = (currentMonth + 1) % 12;

    const list = bills.filter((bill) => {
      if (bill.recurrence !== "monthly") return false;
      if (bill.isPaid) return false;

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

      if (dueThisMonth >= today && dueThisMonth <= nextPayDate) return true;
      if (dueNextMonth >= today && dueNextMonth <= nextPayDate) return true;
      return false;
    });

    return list.sort((a, b) => a.dueDay - b.dueDay);
  }, [bills, paySchedule]);

  // Inputs: allocations for each upcoming bill (by billId)
  const [allocations, setAllocations] = useState<Record<string, string>>({});

  // Inputs: optional extra debt payments (credit/loan accounts only)
  const debtAccounts = useMemo(
    () => accounts.filter((a) => a.type === "credit" || a.type === "loan"),
    [accounts]
  );
  const [extraDebtAlloc, setExtraDebtAlloc] = useState<Record<string, string>>(
    {}
  );

  const plannedForPeriod = useMemo(
    () =>
      payPeriodId
        ? allPlanned.filter((p) => p.payPeriodId === payPeriodId)
        : [],
    [allPlanned, payPeriodId]
  );

  // Initialize from storage
  const loadAll = useCallback(async () => {
    const [schedule, accs, bs, pp] = await Promise.all([
      PayScheduleStorage.get(),
      AccountStorage.getAll(),
      BillStorage.getAll(),
      PlannedPaymentStorage.getAll(),
    ]);
    setPaySchedule(schedule);
    setAccounts(accs);
    setBills(bs);
    setAllPlanned(pp);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Prefill allocations from existing planned payments for this period
  useEffect(() => {
    if (!payPeriodId) return;
    const seedBill: Record<string, string> = {};
    const seedDebt: Record<string, string> = {};

    for (const p of plannedForPeriod) {
      if (p.billId) seedBill[p.billId] = String(p.amount);
      else if (p.accountId) seedDebt[p.accountId] = String(p.amount);
    }

    // Only seed once per period load (avoid clobbering user edits): seed when empty
    setAllocations((prev) => (Object.keys(prev).length ? prev : seedBill));
    setExtraDebtAlloc((prev) => (Object.keys(prev).length ? prev : seedDebt));
  }, [payPeriodId, plannedForPeriod]);

  const paycheckAmount = paySchedule?.typicalAmount || 0;

  const totalAllocated = useMemo(() => {
    const billSum = Object.values(allocations).reduce(
      (sum, v) => sum + (parseFloat(v) || 0),
      0
    );
    const debtSum = Object.values(extraDebtAlloc).reduce(
      (sum, v) => sum + (parseFloat(v) || 0),
      0
    );
    return billSum + debtSum;
  }, [allocations, extraDebtAlloc]);

  const remaining = Math.max(0, paycheckAmount - totalAllocated);
  const overAllocated = totalAllocated > paycheckAmount;

  const updateAllocation = (id: string, value: string) => {
    setAllocations((prev) => ({ ...prev, [id]: value }));
  };

  const updateDebtAllocation = (id: string, value: string) => {
    setExtraDebtAlloc((prev) => ({ ...prev, [id]: value }));
  };

  const suggestedAmount = (b: Bill) => {
    if (b.amount && b.amount > 0) return b.amount;
    if (b.minAmount && b.minAmount > 0) return b.minAmount;
    return 0;
  };

  const handleSave = async () => {
    if (!payPeriodId) {
      alert("Set your pay schedule on the Income page first.");
      return;
    }

    if (overAllocated) {
      alert("Total allocation exceeds paycheck amount. Reduce amounts.");
      return;
    }

    const now = new Date().toISOString();

    const newEntries: PlannedPayment[] = [];

    // Bill allocations
    for (const b of upcomingBills) {
      const raw = allocations[b.id];
      const amt = raw ? parseFloat(raw) : 0;
      if (amt > 0) {
        newEntries.push({
          id: crypto.randomUUID(),
          payPeriodId,
          billId: b.id,
          accountId: b.accountId,
          amount: amt,
          createdAt: now,
        });
      }
    }

    // Extra debt allocations
    for (const acc of debtAccounts) {
      const raw = extraDebtAlloc[acc.id];
      const amt = raw ? parseFloat(raw) : 0;
      if (amt > 0) {
        newEntries.push({
          id: crypto.randomUUID(),
          payPeriodId,
          accountId: acc.id,
          amount: amt,
          createdAt: now,
        });
      }
    }

    // Delete existing entries for this pay period and create new ones
    const deletePromises = plannedForPeriod.map((p) =>
      PlannedPaymentStorage.delete(p.id)
    );
    await Promise.all(deletePromises);

    // Create new entries
    const createPromises = newEntries.map((entry) =>
      PlannedPaymentStorage.add(entry)
    );
    await Promise.all(createPromises);

    // Reload all planned payments
    const updated = await PlannedPaymentStorage.getAll();
    setAllPlanned(updated);
    alert("Plan saved.");
  };

  const handlePostPayments = async () => {
    if (!payPeriodId) {
      alert("No pay period selected.");
      return;
    }

    if (plannedForPeriod.length === 0) {
      alert("No planned payments to post. Save a plan first.");
      return;
    }

    if (
      !confirm(
        "Post all planned payments as transactions? This will create payment transactions and mark bills as paid."
      )
    ) {
      return;
    }

    try {
      const today = new Date().toISOString().split("T")[0];
      const transactionPromises: Promise<Response>[] = [];
      const billUpdatePromises: Promise<boolean>[] = [];

      // Create transactions for each planned payment
      for (const planned of plannedForPeriod) {
        // Determine from/to accounts based on payment type
        let fromAccountId: string | undefined;
        let toAccountId: string | undefined;
        let description = "";

        if (planned.billId) {
          // Bill payment
          const bill = bills.find((b) => b.id === planned.billId);
          if (bill) {
            description = `Payment: ${bill.name}`;
            if (bill.accountId) {
              // Payment TO the bill's linked account (e.g., credit card, loan)
              toAccountId = bill.accountId;
            }
          }
          // Mark bill as paid
          billUpdatePromises.push(
            BillStorage.update(planned.billId, { isPaid: true })
          );
        } else if (planned.accountId) {
          // Extra debt payment
          const account = accounts.find((a) => a.id === planned.accountId);
          if (account) {
            description = `Extra payment: ${account.name}`;
            toAccountId = planned.accountId;
          }
        }

        // Create payment transaction
        const txPromise = fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "payment",
            fromAccountId,
            toAccountId,
            amount: planned.amount,
            date: today,
            description,
            metadata: {
              payPeriodId: planned.payPeriodId,
              plannedPaymentId: planned.id,
            },
          }),
        });

        transactionPromises.push(txPromise);
      }

      // Wait for all transactions and bill updates
      await Promise.all([...transactionPromises, ...billUpdatePromises]);

      // Mark planned payments as executed
      for (const p of plannedForPeriod) {
        await PlannedPaymentStorage.update(p.id, {
          executedAt: new Date().toISOString(),
        });
      }

      // Reload data
      await loadAll();

      alert(
        `Successfully posted ${plannedForPeriod.length} payment(s) and marked bills as paid!`
      );
    } catch (error) {
      console.error("Error posting payments:", error);
      alert("Failed to post some payments. Check console for details.");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Payment Planner</h1>
          <p className="text-muted-foreground">
            Allocate your next paycheck across upcoming bills and debts.
          </p>
        </div>

        {plannedForPeriod.length > 0 &&
          plannedForPeriod.every((p) => p.executedAt) && (
            <Card className="border-green-600 bg-green-50 dark:bg-green-950/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <span className="text-2xl">✓</span>
                  <div>
                    <p className="font-semibold">All payments posted!</p>
                    <p className="text-sm">
                      {plannedForPeriod.length} payment(s) have been
                      successfully posted as transactions and bills marked as
                      paid.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Next Paycheck</CardTitle>
              <CardDescription>
                {paySchedule
                  ? `Pay date: ${new Date(
                      paySchedule.nextPayDate
                    ).toLocaleDateString()} • Amount: ${currency(
                      paycheckAmount
                    )}`
                  : "Set your pay schedule on the Income page"}
              </CardDescription>
            </div>
            <div className="text-right">
              <div
                className={`text-sm ${
                  overAllocated ? "text-red-500" : "text-green-600"
                }`}
              >
                Remaining: {currency(paycheckAmount - totalAllocated)}
              </div>
              <div className="text-xs text-muted-foreground">
                Allocated: {currency(totalAllocated)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Upcoming bills allocation */}
            <div>
              <h3 className="font-semibold mb-3">
                Upcoming Bills (before next pay)
              </h3>
              {upcomingBills.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No upcoming unpaid monthly bills in this window.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill</TableHead>
                      <TableHead>Due Day</TableHead>
                      <TableHead>Suggested</TableHead>
                      <TableHead>Allocate ($)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingBills.map((b) => {
                      const suggested = suggestedAmount(b);
                      const planned = plannedForPeriod.find(
                        (p) => p.billId === b.id
                      );
                      const val =
                        allocations[b.id] ?? planned?.amount?.toString() ?? "";
                      const isPosted = planned?.executedAt;
                      return (
                        <TableRow
                          key={b.id}
                          className={
                            isPosted ? "bg-green-50 dark:bg-green-950/20" : ""
                          }
                        >
                          <TableCell className="font-medium">
                            {b.name}
                            {isPosted && (
                              <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                ✓ Posted
                              </span>
                            )}
                          </TableCell>
                          <TableCell>Day {b.dueDay}</TableCell>
                          <TableCell>
                            {suggested > 0 ? currency(suggested) : "-"}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={val}
                              onChange={(e) =>
                                updateAllocation(b.id, e.target.value)
                              }
                              placeholder={
                                suggested > 0 ? suggested.toFixed(2) : "0.00"
                              }
                              disabled={!!isPosted}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            {/* Extra debt payments */}
            <div>
              <h3 className="font-semibold mb-3">
                Extra Debt Payments (optional)
              </h3>
              {debtAccounts.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No credit or loan accounts found.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Allocate ($)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {debtAccounts.map((a) => {
                      const planned = plannedForPeriod.find(
                        (p) => p.accountId === a.id && !p.billId
                      );
                      const val =
                        extraDebtAlloc[a.id] ??
                        planned?.amount?.toString() ??
                        "";
                      const isPosted = planned?.executedAt;
                      return (
                        <TableRow
                          key={a.id}
                          className={
                            isPosted ? "bg-green-50 dark:bg-green-950/20" : ""
                          }
                        >
                          <TableCell className="font-medium">
                            {a.name}
                            {isPosted && (
                              <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                                ✓ Posted
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="capitalize">{a.type}</TableCell>
                          <TableCell>{currency(a.balance)}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={val}
                              onChange={(e) =>
                                updateDebtAllocation(a.id, e.target.value)
                              }
                              placeholder="0.00"
                              disabled={!!isPosted}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div
                className={`text-sm ${
                  overAllocated ? "text-red-500" : "text-muted-foreground"
                }`}
              >
                {overAllocated
                  ? "Over-allocated. Reduce amounts before saving."
                  : plannedForPeriod.length > 0 &&
                      plannedForPeriod.some((p) => p.executedAt)
                    ? "Some payments already posted."
                    : "You can save this plan and revisit anytime."}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={!paySchedule || overAllocated}
                  variant="outline"
                >
                  Save Plan
                </Button>
                <Button
                  onClick={handlePostPayments}
                  disabled={
                    !paySchedule ||
                    plannedForPeriod.length === 0 ||
                    plannedForPeriod.some((p) => p.executedAt)
                  }
                >
                  Post Payments
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
