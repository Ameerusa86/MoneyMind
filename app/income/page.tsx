"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PayScheduleStorage, AccountStorage } from "@/lib/storage";
import { PaySchedule, PayFrequency, Account } from "@/lib/types";
import { Pencil, Trash2, Plus } from "lucide-react";

export default function IncomePage() {
  const [schedules, setSchedules] = useState<PaySchedule[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [owner, setOwner] = useState("");
  const [frequency, setFrequency] = useState<PayFrequency>("bi-weekly");
  const [nextPayDate, setNextPayDate] = useState("");
  const [amount, setAmount] = useState("");
  const [depositAccountId, setDepositAccountId] = useState("none");
  const [isVariableAmount, setIsVariableAmount] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [allSchedules, allAccounts] = await Promise.all([
      PayScheduleStorage.getAll(),
      AccountStorage.getAll(),
    ]);

    setSchedules(allSchedules);

    const bankAccounts = allAccounts.filter(
      (acc) => acc.type === "checking" || acc.type === "savings"
    );
    setAccounts(bankAccounts);
  };

  const resetForm = () => {
    setOwner("");
    setFrequency("bi-weekly");
    setNextPayDate("");
    setAmount("");
    setDepositAccountId("none");
    setIsVariableAmount(false);
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (schedule: PaySchedule) => {
    setOwner(schedule.owner || "");
    setFrequency(schedule.frequency);
    setNextPayDate(schedule.nextPayDate.split("T")[0]);
    setAmount(schedule.typicalAmount.toString());
    setDepositAccountId(schedule.depositAccountId || "none");
    setIsVariableAmount(schedule.typicalAmount === 0);
    setEditingId(schedule.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pay schedule?")) return;

    const success = await PayScheduleStorage.delete(id);
    if (success) {
      await loadData();
    }
  };

  const handleSave = async () => {
    if (!owner || !nextPayDate || (!isVariableAmount && !amount)) {
      alert("Please fill in all required fields");
      return;
    }

    const scheduleData = {
      owner,
      frequency,
      nextPayDate: new Date(nextPayDate).toISOString(),
      typicalAmount: isVariableAmount ? 0 : parseFloat(amount),
      depositAccountId:
        depositAccountId !== "none" ? depositAccountId : undefined,
    };

    let success;
    if (editingId) {
      success = await PayScheduleStorage.update(editingId, scheduleData);
    } else {
      success = await PayScheduleStorage.add(scheduleData);
    }

    if (success) {
      await loadData();
      resetForm();
    }
  };

  const calculateUpcomingPayDates = (
    startDate: string,
    freq: PayFrequency,
    count: number = 3
  ): string[] => {
    const dates: string[] = [];
    const start = new Date(startDate);

    for (let i = 0; i < count; i++) {
      const date = new Date(start);

      switch (freq) {
        case "weekly":
          date.setDate(date.getDate() + i * 7);
          break;
        case "bi-weekly":
          date.setDate(date.getDate() + i * 14);
          break;
        case "semi-monthly":
          date.setDate(date.getDate() + i * 15);
          break;
        case "monthly":
          date.setMonth(date.getMonth() + i);
          break;
      }

      dates.push(
        date.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      );
    }

    return dates;
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Income Schedules</h1>
            <p className="text-muted-foreground">
              Set up pay schedules for all income sources (yours and your
              spouse&apos;s)
            </p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          )}
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingId ? "Edit Pay Schedule" : "New Pay Schedule"}
              </CardTitle>
              <CardDescription>
                Configure income source, frequency, and deposit account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Owner (Who gets paid?) *
                </label>
                <Input
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="e.g., You, Wife, Partner, John"
                />
                <p className="text-xs text-muted-foreground">
                  Helps identify whose paycheck this is
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Pay Frequency *</label>
                <Select
                  value={frequency}
                  onValueChange={(val) => setFrequency(val as PayFrequency)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">
                      Bi-Weekly (Every 2 weeks)
                    </SelectItem>
                    <SelectItem value="semi-monthly">
                      Semi-Monthly (Twice per month)
                    </SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Next Pay Date *</label>
                <Input
                  type="date"
                  value={nextPayDate}
                  onChange={(e) => setNextPayDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="variableAmount"
                    checked={isVariableAmount}
                    onChange={(e) => setIsVariableAmount(e.target.checked)}
                  />
                  <label htmlFor="variableAmount" className="text-sm">
                    Variable amount (paid by the hour)
                  </label>
                </div>
                {!isVariableAmount && (
                  <>
                    <label className="text-sm font-medium">
                      Typical Net Amount ($) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                    />
                  </>
                )}
                {isVariableAmount && (
                  <p className="text-sm text-muted-foreground">
                    For variable pay, you&apos;ll enter the actual amount during
                    the payday session
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Deposit Account (Optional)
                </label>
                <Select
                  value={depositAccountId}
                  onValueChange={setDepositAccountId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      None (Don&apos;t link to account)
                    </SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id!}>
                        {account.name} ({account.type}) - $
                        {account.balance.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1">
                  {editingId ? "Update Schedule" : "Save Schedule"}
                </Button>
                <Button
                  variant="outline"
                  onClick={resetForm}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Existing Schedules */}
        {schedules.length === 0 && !showForm && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No income schedules configured yet
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Schedule
              </Button>
            </CardContent>
          </Card>
        )}

        {schedules.map((schedule) => (
          <Card key={schedule.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    {schedule.owner || "Unnamed"}
                  </CardTitle>
                  <CardDescription>
                    {schedule.frequency.replace("-", " ")} •{" "}
                    {schedule.typicalAmount === 0
                      ? "Variable amount"
                      : `$${schedule.typicalAmount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}`}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(schedule)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(schedule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">
                    Next 3 Pay Dates
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {calculateUpcomingPayDates(
                      schedule.nextPayDate,
                      schedule.frequency
                    ).map((date, index) => (
                      <li key={index} className="text-muted-foreground">
                        {index + 1}. {date}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  {schedule.depositAccountId && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">
                        Deposit Account
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {accounts.find(
                          (a) => a.id === schedule.depositAccountId
                        )?.name || "Unknown Account"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
