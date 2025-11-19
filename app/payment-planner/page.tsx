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
import { Storage, StorageKeys } from "@/lib/storage";
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
  const loadAll = useCallback(() => {
    const schedule = Storage.get<PaySchedule>(StorageKeys.PAY_SCHEDULE) || null;
    const accs = Storage.get<Account[]>(StorageKeys.ACCOUNTS) || [];
    const bs = Storage.get<Bill[]>(StorageKeys.BILLS) || [];
    const pp =
      Storage.get<PlannedPayment[]>(StorageKeys.PLANNED_PAYMENTS) || [];
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

  const handleSave = () => {
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

    // Merge by replacing any existing entries for this pay period
    const withoutThisPeriod = allPlanned.filter(
      (p) => p.payPeriodId !== payPeriodId
    );
    const merged = [...withoutThisPeriod, ...newEntries];

    Storage.set(StorageKeys.PLANNED_PAYMENTS, merged);
    setAllPlanned(merged);
    alert("Plan saved.");
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
                      const val =
                        allocations[b.id] ??
                        plannedForPeriod
                          .find((p) => p.billId === b.id)
                          ?.amount?.toString() ??
                        "";
                      return (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">
                            {b.name}
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
                      const val =
                        extraDebtAlloc[a.id] ??
                        plannedForPeriod
                          .find((p) => p.accountId === a.id && !p.billId)
                          ?.amount?.toString() ??
                        "";
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="font-medium">
                            {a.name}
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
                  : "You can save this plan and revisit anytime."}
              </div>
              <Button
                onClick={handleSave}
                disabled={!paySchedule || overAllocated}
              >
                Save Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
