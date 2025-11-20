"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PayPeriodStorage,
  AccountStorage,
  PlannedPaymentStorage,
  TransactionStorage,
} from "@/lib/storage";
import type {
  PayPeriod,
  Account,
  PlannedPayment,
  Transaction,
} from "@/lib/types";
import {
  DollarSign,
  Calendar,
  CheckCircle2,
  ArrowRight,
  CreditCard,
} from "lucide-react";

export default function PaydayPage() {
  const [currentStep, setCurrentStep] = useState<string>("income");
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [plannedPayments, setPlannedPayments] = useState<PlannedPayment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Session state
  const [recordedDeposits, setRecordedDeposits] = useState<Set<string>>(
    new Set()
  );
  const [paymentAllocations, setPaymentAllocations] = useState<
    { accountId: string; amount: number; sourceAccountId: string }[]
  >([]);
  const [executedPayments, setExecutedPayments] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [periodsData, accountsData, paymentsData, txnsData] =
        await Promise.all([
          PayPeriodStorage.getAll(),
          AccountStorage.getAll(),
          PlannedPaymentStorage.getAll(),
          TransactionStorage.getAll(),
        ]);

      setPayPeriods(periodsData);
      setAccounts(accountsData);
      setPlannedPayments(paymentsData);
      setTransactions(txnsData);
    } catch (error) {
      console.error("Error loading payday data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCheckingAccounts = () => {
    return accounts.filter((a) => a.type === "checking");
  };

  const getDebtAccounts = () => {
    return accounts.filter((a) => a.type === "credit" || a.type === "loan");
  };

  const getUpcomingPayPeriods = () => {
    const today = new Date();
    return payPeriods.filter((p) => {
      const payDate = new Date(p.payDate);
      const daysUntil = Math.ceil(
        (payDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntil >= -7 && daysUntil <= 7; // Within 7 days
    });
  };

  const handleRecordDeposit = async (period: PayPeriod) => {
    try {
      // Create income_deposit transaction
      const transaction = await TransactionStorage.add({
        type: "income_deposit",
        toAccountId: period.depositAccountId,
        amount: period.actualAmount || period.expectedAmount,
        date: period.payDate,
        description: `Paycheck deposit - ${period.payDate}`,
        metadata: {
          payPeriodId: period.id,
        },
      });

      if (transaction) {
        setRecordedDeposits(new Set([...recordedDeposits, period.id]));
        // Reload data to show updated balances
        await loadData();
      }
    } catch (error) {
      console.error("Error recording deposit:", error);
      alert("Failed to record deposit");
    }
  };

  const getTotalIncome = () => {
    return getUpcomingPayPeriods()
      .filter((p) => recordedDeposits.has(p.id))
      .reduce((sum, p) => sum + (p.actualAmount || p.expectedAmount), 0);
  };

  const getTotalPlannedPayments = () => {
    let total = 0;
    paymentAllocations.forEach((allocation) => {
      total += allocation.amount;
    });
    return total;
  };

  const getCheckingBalance = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account?.balance || 0;
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
                {getUpcomingPayPeriods().length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No upcoming pay periods found. Set up your income schedule
                    first.
                  </p>
                ) : (
                  getUpcomingPayPeriods().map((period) => (
                    <div
                      key={period.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{period.payDate}</span>
                          {recordedDeposits.has(period.id) && (
                            <Badge variant="default" className="ml-2">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Recorded
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Expected: $
                          {(
                            period.actualAmount || period.expectedAmount
                          ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        {period.depositAccountId && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Deposit to:{" "}
                            {
                              accounts.find(
                                (a) => a.id === period.depositAccountId
                              )?.name
                            }
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleRecordDeposit(period)}
                        disabled={recordedDeposits.has(period.id)}
                      >
                        {recordedDeposits.has(period.id)
                          ? "Recorded"
                          : "Record Deposit"}
                      </Button>
                    </div>
                  ))
                )}

                {getUpcomingPayPeriods().length > 0 && (
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

          {/* Step 3: Execute (placeholder) */}
          <TabsContent value="execute">
            <Card>
              <CardHeader>
                <CardTitle>Execute Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Step 3 implementation coming next...
                </p>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep("review")}
                  >
                    Back
                  </Button>
                  <Button onClick={() => setCurrentStep("summary")}>
                    Continue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Step 4: Summary (placeholder) */}
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Session Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Step 4 implementation coming next...
                </p>
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep("income")}
                  className="mt-4"
                >
                  Start New Session
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
