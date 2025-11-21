"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PayScheduleStorage,
  AccountStorage,
  TransactionStorage,
} from "@/lib/storage";
import type { PaySchedule, Account } from "@/lib/types";
import {
  DollarSign,
  Calendar,
  CheckCircle2,
  ArrowRight,
  CreditCard,
} from "lucide-react";

export default function PaydayPage() {
  const [currentStep, setCurrentStep] = useState<string>("income");
  const [paySchedules, setPaySchedules] = useState<PaySchedule[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  // Session state
  const [recordedDeposits, setRecordedDeposits] = useState<Set<string>>(
    new Set()
  );
  const [depositAmounts, setDepositAmounts] = useState<Record<string, number>>(
    {}
  );
  const [paymentAllocations, setPaymentAllocations] = useState<
    { accountId: string; amount: number; sourceAccountId: string }[]
  >([]);
  const [executedPaymentIds, setExecutedPaymentIds] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [schedulesData, accountsData] = await Promise.all([
        PayScheduleStorage.getAll(),
        AccountStorage.getAll(),
      ]);

      setPaySchedules(schedulesData);
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error loading payday data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format dates
  const formatPayDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleRecordDeposit = async (scheduleId: string) => {
    try {
      const schedule = paySchedules.find((s) => s.id === scheduleId);
      if (!schedule) return;

      const amount = depositAmounts[scheduleId] || schedule.typicalAmount || 0;
      const today = new Date().toISOString().split("T")[0];

      const transaction = await TransactionStorage.add({
        type: "income_deposit",
        toAccountId: schedule.depositAccountId,
        amount,
        date: today,
        description: `Paycheck deposit - ${schedule.owner}`,
        metadata: {
          payScheduleId: scheduleId,
        },
      });

      if (transaction) {
        setRecordedDeposits(new Set([...recordedDeposits, scheduleId]));
        // Reload accounts to show updated balances
        await loadData();
      }
    } catch (error) {
      console.error("Error recording deposit:", error);
      alert("Failed to record deposit");
    }
  };

  const getTotalIncome = () => {
    return paySchedules
      .filter((s) => recordedDeposits.has(s.id))
      .reduce(
        (sum, s) => sum + (depositAmounts[s.id] || s.typicalAmount || 0),
        0
      );
  };

  const getTotalPlannedPayments = () => {
    let total = 0;
    paymentAllocations.forEach((allocation) => {
      total += allocation.amount;
    });
    return total;
  };

  const handleExecutePayments = async () => {
    const today = new Date().toISOString().split("T")[0];
    const newExecutedIds: string[] = [];

    for (const allocation of paymentAllocations) {
      try {
        const transaction = await TransactionStorage.add({
          type: "payment",
          fromAccountId: allocation.sourceAccountId,
          toAccountId: allocation.accountId,
          amount: allocation.amount,
          date: today,
          description: `Payment to ${accounts.find((a) => a.id === allocation.accountId)?.name || "account"}`,
        });

        if (transaction) {
          newExecutedIds.push(`${allocation.accountId}-${allocation.amount}`);
        }
      } catch (error) {
        console.error("Error executing payment:", error);
        alert(
          `Failed to execute payment to ${accounts.find((a) => a.id === allocation.accountId)?.name}`
        );
      }
    }

    setExecutedPaymentIds(newExecutedIds);
    await loadData(); // Refresh balances
    setCurrentStep("summary");
  };

  const handleStartNewSession = () => {
    setRecordedDeposits(new Set());
    setDepositAmounts({});
    setPaymentAllocations([]);
    setExecutedPaymentIds([]);
    setCurrentStep("income");
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">Loading payday session...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Payday Session</h1>
          <p className="text-muted-foreground">
            Record income, review accounts, and execute payments
          </p>
        </div>

        {/* Progress Indicator */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div
                className={`flex items-center gap-2 ${currentStep === "income" ? "text-primary font-semibold" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "income" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  1
                </div>
                <span>Record Income</span>
              </div>
              <ArrowRight className="text-muted-foreground" />
              <div
                className={`flex items-center gap-2 ${currentStep === "review" ? "text-primary font-semibold" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "review" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  2
                </div>
                <span>Review & Adjust</span>
              </div>
              <ArrowRight className="text-muted-foreground" />
              <div
                className={`flex items-center gap-2 ${currentStep === "execute" ? "text-primary font-semibold" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "execute" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  3
                </div>
                <span>Execute Payments</span>
              </div>
              <ArrowRight className="text-muted-foreground" />
              <div
                className={`flex items-center gap-2 ${currentStep === "summary" ? "text-primary font-semibold" : "text-muted-foreground"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === "summary" ? "bg-primary text-primary-foreground" : "bg-muted"}`}
                >
                  4
                </div>
                <span>Summary</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={currentStep} onValueChange={setCurrentStep}>
          <TabsList className="hidden">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
            <TabsTrigger value="execute">Execute</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          {/* Step 1: Record Income */}
          <TabsContent value="income" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Record Income Deposits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {paySchedules.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No pay schedules found. Set up your income schedule first.
                  </p>
                ) : (
                  paySchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {schedule.owner || "Income"} - {schedule.frequency}
                          </span>
                          {recordedDeposits.has(schedule.id) && (
                            <Badge variant="default" className="ml-2">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Recorded
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Next pay date: {formatPayDate(schedule.nextPayDate)}
                        </p>
                        <div className="mt-2">
                          <label className="text-xs text-muted-foreground">
                            Amount:
                          </label>
                          <input
                            type="number"
                            className="ml-2 w-32 px-2 py-1 border rounded text-sm"
                            placeholder={
                              schedule.typicalAmount?.toString() || "0"
                            }
                            value={depositAmounts[schedule.id] || ""}
                            onChange={(e) =>
                              setDepositAmounts({
                                ...depositAmounts,
                                [schedule.id]: parseFloat(e.target.value) || 0,
                              })
                            }
                            disabled={recordedDeposits.has(schedule.id)}
                          />
                        </div>
                        {schedule.depositAccountId && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Deposit to:{" "}
                            {
                              accounts.find(
                                (a) => a.id === schedule.depositAccountId
                              )?.name
                            }
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleRecordDeposit(schedule.id)}
                        disabled={
                          recordedDeposits.has(schedule.id) ||
                          !(
                            depositAmounts[schedule.id] ||
                            schedule.typicalAmount
                          )
                        }
                      >
                        {recordedDeposits.has(schedule.id)
                          ? "Recorded"
                          : "Record Deposit"}
                      </Button>
                    </div>
                  ))
                )}

                {paySchedules.length > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-lg font-semibold">
                        Total Income Recorded:
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        $
                        {getTotalIncome().toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => setCurrentStep("review")}
                      disabled={recordedDeposits.size === 0}
                    >
                      Continue to Review Payments
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 2: Review & Adjust Payments */}
          <TabsContent value="review">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Review & Adjust Payments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Available Funds */}
                <div>
                  <h3 className="font-semibold mb-3">Available Funds</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {accounts
                      .filter((a) => a.type === "checking")
                      .map((account) => (
                        <div
                          key={account.id}
                          className="flex justify-between items-center p-3 border rounded-md"
                        >
                          <span className="font-medium">{account.name}</span>
                          <span className="text-lg font-semibold">
                            ${account.balance.toFixed(2)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Payment Allocations */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Payment Allocations</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const debtAccounts = accounts.filter(
                          (a) => a.type === "credit" || a.type === "loan"
                        );
                        const checkingAccounts = accounts.filter(
                          (a) => a.type === "checking"
                        );
                        if (
                          debtAccounts.length > 0 &&
                          checkingAccounts.length > 0
                        ) {
                          setPaymentAllocations([
                            ...paymentAllocations,
                            {
                              accountId: debtAccounts[0].id!,
                              amount: 0,
                              sourceAccountId: checkingAccounts[0].id!,
                            },
                          ]);
                        }
                      }}
                    >
                      Add Payment
                    </Button>
                  </div>

                  {paymentAllocations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8 border rounded-md">
                      No payments allocated. Click &quot;Add Payment&quot; to
                      get started.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {paymentAllocations.map((allocation, index) => {
                        const debtAccounts = accounts.filter(
                          (a) => a.type === "credit" || a.type === "loan"
                        );
                        const checkingAccounts = accounts.filter(
                          (a) => a.type === "checking"
                        );
                        return (
                          <div
                            key={index}
                            className="flex flex-col md:flex-row gap-3 p-3 border rounded-md"
                          >
                            <div className="flex-1">
                              <label className="text-sm text-muted-foreground">
                                Debt Account
                              </label>
                              <select
                                className="w-full border rounded-md px-3 py-2 mt-1"
                                value={allocation.accountId}
                                onChange={(e) => {
                                  const newAccountId = e.target.value;
                                  setPaymentAllocations((prev) =>
                                    prev.map((p, i) =>
                                      i === index
                                        ? { ...p, accountId: newAccountId }
                                        : p
                                    )
                                  );
                                }}
                              >
                                {debtAccounts.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.name} (${a.balance.toFixed(2)})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex-1">
                              <label className="text-sm text-muted-foreground">
                                Payment Amount
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-full border rounded-md px-3 py-2 mt-1"
                                value={allocation.amount}
                                onChange={(e) => {
                                  const newAmount =
                                    parseFloat(e.target.value) || 0;
                                  setPaymentAllocations((prev) =>
                                    prev.map((p, i) =>
                                      i === index
                                        ? { ...p, amount: newAmount }
                                        : p
                                    )
                                  );
                                }}
                              />
                            </div>

                            <div className="flex-1">
                              <label className="text-sm text-muted-foreground">
                                From Account
                              </label>
                              <select
                                className="w-full border rounded-md px-3 py-2 mt-1"
                                value={allocation.sourceAccountId}
                                onChange={(e) => {
                                  const newSource = e.target.value;
                                  setPaymentAllocations((prev) =>
                                    prev.map((p, i) =>
                                      i === index
                                        ? { ...p, sourceAccountId: newSource }
                                        : p
                                    )
                                  );
                                }}
                              >
                                {checkingAccounts.map((a) => (
                                  <option key={a.id} value={a.id}>
                                    {a.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-end">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setPaymentAllocations((prev) =>
                                    prev.filter((_, i) => i !== index)
                                  );
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Summary */}
                {paymentAllocations.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Payment Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total Payments:</span>
                        <span className="font-semibold">
                          ${getTotalPlannedPayments().toFixed(2)}
                        </span>
                      </div>
                      {accounts
                        .filter((a) => a.type === "checking")
                        .map((account) => {
                          const totalFromAccount = paymentAllocations
                            .filter((p) => p.sourceAccountId === account.id)
                            .reduce((sum, p) => sum + p.amount, 0);
                          const remaining = account.balance - totalFromAccount;
                          return (
                            <div
                              key={account.id}
                              className="flex justify-between"
                            >
                              <span>{account.name} Remaining:</span>
                              <span
                                className={`font-semibold ${
                                  remaining < 0
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                ${remaining.toFixed(2)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep("income")}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStep("execute")}
                    disabled={paymentAllocations.length === 0}
                  >
                    Continue to Execute Payments
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 3: Execute Payments */}
          <TabsContent value="execute">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Execute Payments
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Review your payments before executing. This will create
                    transactions and update account balances.
                  </p>

                  {/* Payment List */}
                  {paymentAllocations.length > 0 && (
                    <div className="border rounded-lg divide-y">
                      {paymentAllocations.map((allocation, index) => {
                        const account = accounts.find(
                          (a) => a.id === allocation.accountId
                        );
                        const sourceAccount = accounts.find(
                          (a) => a.id === allocation.sourceAccountId
                        );
                        return (
                          <div key={index} className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{account?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  From: {sourceAccount?.name}
                                </p>
                              </div>
                              <p className="text-lg font-semibold">
                                ${allocation.amount.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Summary */}
                  <div className="bg-muted p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span>Total Payments:</span>
                      <span className="font-semibold">
                        ${getTotalPlannedPayments().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Income Recorded:</span>
                      <span className="font-semibold text-green-600">
                        ${getTotalIncome().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-semibold">Net Change:</span>
                      <span
                        className={`font-bold ${getTotalIncome() - getTotalPlannedPayments() >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        $
                        {(getTotalIncome() - getTotalPlannedPayments()).toFixed(
                          2
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep("review")}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleExecutePayments}
                    disabled={paymentAllocations.length === 0}
                    className="flex-1"
                  >
                    Execute All Payments
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 4: Summary */}
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Session Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Success message */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">
                    Payday session completed successfully!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    All income deposits and payments have been recorded.
                  </p>
                </div>

                {/* Income Summary */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Income Recorded
                  </h3>
                  <div className="border rounded-lg divide-y">
                    {paySchedules
                      .filter((s) => recordedDeposits.has(s.id))
                      .map((schedule) => {
                        const amount =
                          depositAmounts[schedule.id] ||
                          schedule.typicalAmount ||
                          0;
                        const account = accounts.find(
                          (a) => a.id === schedule.depositAccountId
                        );
                        return (
                          <div
                            key={schedule.id}
                            className="p-3 flex justify-between"
                          >
                            <div>
                              <p className="font-medium">
                                {schedule.owner || "Income"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                To: {account?.name}
                              </p>
                            </div>
                            <p className="font-semibold text-green-600">
                              ${amount.toFixed(2)}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                  <div className="mt-2 p-3 bg-muted rounded-lg flex justify-between">
                    <span className="font-semibold">Total Income:</span>
                    <span className="font-bold text-green-600">
                      ${getTotalIncome().toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Payments Summary */}
                {executedPaymentIds.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Payments Executed
                    </h3>
                    <div className="border rounded-lg divide-y">
                      {paymentAllocations.map((allocation, index) => {
                        const account = accounts.find(
                          (a) => a.id === allocation.accountId
                        );
                        const sourceAccount = accounts.find(
                          (a) => a.id === allocation.sourceAccountId
                        );
                        return (
                          <div key={index} className="p-3 flex justify-between">
                            <div>
                              <p className="font-medium">{account?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                From: {sourceAccount?.name}
                              </p>
                            </div>
                            <p className="font-semibold">
                              ${allocation.amount.toFixed(2)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-2 p-3 bg-muted rounded-lg flex justify-between">
                      <span className="font-semibold">Total Payments:</span>
                      <span className="font-bold">
                        ${getTotalPlannedPayments().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Net Summary */}
                <div className="border-t pt-4">
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold">Net Impact:</span>
                      <span
                        className={`text-2xl font-bold ${getTotalIncome() - getTotalPlannedPayments() >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        $
                        {(getTotalIncome() - getTotalPlannedPayments()).toFixed(
                          2
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleStartNewSession}
                    className="flex-1"
                  >
                    Start New Session
                  </Button>
                  <Button
                    onClick={() => (window.location.href = "/")}
                    className="flex-1"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
