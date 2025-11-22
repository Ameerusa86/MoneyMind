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
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { AccountStorage } from "@/lib/storage";
import { Account, AccountType } from "@/lib/types";
import { Plus, Edit, Trash2, CreditCard, Landmark } from "lucide-react";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<
    Array<
      Account & {
        calculatedBalance?: number;
        balanceDifference?: number;
      }
    >
  >([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("credit");
  const [balance, setBalance] = useState("");
  const [apr, setApr] = useState("");
  const [minPayment, setMinPayment] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    // Load accounts with calculated balances on mount
    loadAccountsWithBalances();
  }, []);

  const loadAccountsWithBalances = async () => {
    setLoadingBalances(true);
    const saved = await AccountStorage.getAllWithBalances();
    setAccounts(saved);
    setLoadingBalances(false);
  };

  const resetForm = () => {
    setName("");
    setType("credit");
    setBalance("");
    setApr("");
    setMinPayment("");
    setDueDay("");
    setCreditLimit("");
    setWebsite("");
    setEditingAccount(null);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setName(account.name);
    setType(account.type);
    setBalance(account.balance.toString());
    setApr(account.apr?.toString() || "");
    setMinPayment(account.minPayment?.toString() || "");
    setDueDay(account.dueDay?.toString() || "");
    setCreditLimit(account.creditLimit?.toString() || "");
    setWebsite(account.website || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this account?")) {
      await AccountStorage.delete(id);
      await loadAccountsWithBalances();
    }
  };

  // Removed: handleSyncBalance - this was causing balance to grow every time
  // The stored balance should be the OPENING balance (before any transactions)
  // The calculated balance is computed by applying all transactions to the opening balance
  // Users should only update stored balance when they want to set a new baseline

  const handleSave = async () => {
    if (!name || !balance) {
      alert("Please fill in required fields (Name and Balance)");
      return;
    }

    const accountData = {
      name,
      type,
      balance: parseFloat(balance),
      apr: apr ? parseFloat(apr) : undefined,
      minPayment: minPayment ? parseFloat(minPayment) : undefined,
      dueDay: dueDay ? parseInt(dueDay) : undefined,
      creditLimit: creditLimit ? parseFloat(creditLimit) : undefined,
      website: website || undefined,
    };

    if (editingAccount) {
      await AccountStorage.update(editingAccount.id, accountData);
    } else {
      await AccountStorage.add(accountData);
    }

    await loadAccountsWithBalances();
    setIsDialogOpen(false);
    resetForm();
  };

  const getCreditUtilization = (account: Account) => {
    if (account.type === "credit" && account.creditLimit) {
      return ((account.balance / account.creditLimit) * 100).toFixed(1);
    }
    return null;
  };

  const getAccountIcon = (accountType: AccountType) => {
    return accountType === "credit" ||
      accountType === "checking" ||
      accountType === "savings" ? (
      <CreditCard className="h-5 w-5" />
    ) : (
      <Landmark className="h-5 w-5" />
    );
  };

  const getAccountBadgeColor = (accountType: AccountType) => {
    const colors = {
      credit: "bg-blue-100 text-blue-800",
      loan: "bg-orange-100 text-orange-800",
      checking: "bg-green-100 text-green-800",
      savings: "bg-purple-100 text-purple-800",
    };
    return colors[accountType];
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Accounts</h1>
            <p className="text-muted-foreground">
              Manage your credit cards, loans, and bank accounts
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
                Add Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAccount ? "Edit Account" : "Add New Account"}
                </DialogTitle>
                <DialogDescription>
                  {editingAccount
                    ? "Update account details"
                    : "Add a credit card, loan, or bank account"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Account Name *
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Chase Sapphire, Car Loan"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Account Type *
                    </label>
                    <Select
                      value={type}
                      onValueChange={(val) => setType(val as AccountType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit">Credit Card</SelectItem>
                        <SelectItem value="loan">Loan</SelectItem>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {type === "checking" || type === "savings"
                        ? "Opening Balance ($) *"
                        : "Opening Balance ($) *"}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      {type === "checking" || type === "savings"
                        ? "Opening balance before any imported transactions (e.g., balance on the first transaction date)"
                        : "Opening debt balance before any imported transactions"}
                    </p>
                  </div>

                  {(type === "credit" || type === "loan") && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">APR (%)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={apr}
                        onChange={(e) => setApr(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  )}

                  {type === "credit" && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Credit Limit ($)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={creditLimit}
                        onChange={(e) => setCreditLimit(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  )}
                </div>

                {(type === "credit" || type === "loan") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Minimum Payment ($)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={minPayment}
                        onChange={(e) => setMinPayment(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Due Day (1-31)
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
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Website (Optional)
                  </label>
                  <Input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <Button onClick={handleSave} className="w-full">
                  {editingAccount ? "Update Account" : "Add Account"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Accounts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accounts.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Debt</CardTitle>
              <CardDescription className="text-xs">
                Current balance (with transactions)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                $
                {accounts
                  .filter((a) => a.type === "credit" || a.type === "loan")
                  .reduce(
                    (sum, a) => sum + (a.calculatedBalance ?? a.balance),
                    0
                  )
                  .toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Assets
              </CardTitle>
              <CardDescription className="text-xs">
                Current balance (with transactions)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                $
                {accounts
                  .filter((a) => a.type === "checking" || a.type === "savings")
                  .reduce(
                    (sum, a) => sum + (a.calculatedBalance ?? a.balance),
                    0
                  )
                  .toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Accounts</CardTitle>
            <CardDescription>Manage your financial accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No accounts yet. Click &ldquo;Add Account&rdquo; to get started.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead
                      className="text-right"
                      title="Opening balance (before any transactions)"
                    >
                      Opening Balance
                    </TableHead>
                    <TableHead
                      className="text-right"
                      title="Current balance (opening + all transactions)"
                    >
                      Current Balance
                    </TableHead>
                    <TableHead className="text-right">APR</TableHead>
                    <TableHead className="text-right">Min Payment</TableHead>
                    <TableHead className="text-right">Due Day</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getAccountIcon(account.type)}
                          <div>
                            <div>{account.name}</div>
                            {account.type === "credit" &&
                              account.creditLimit && (
                                <div className="text-xs text-muted-foreground">
                                  Utilization: {getCreditUtilization(account)}%
                                </div>
                              )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getAccountBadgeColor(account.type)}>
                          {account.type.charAt(0).toUpperCase() +
                            account.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        $
                        {account.balance.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {loadingBalances ? (
                          <span className="text-muted-foreground">
                            Loading...
                          </span>
                        ) : account.calculatedBalance !== undefined ? (
                          <div className="flex flex-col items-end">
                            <span
                              className={
                                Math.abs(account.balanceDifference ?? 0) > 0.01
                                  ? "font-semibold text-emerald-600"
                                  : ""
                              }
                            >
                              $
                              {account.calculatedBalance.toLocaleString(
                                "en-US",
                                {
                                  minimumFractionDigits: 2,
                                }
                              )}
                            </span>
                            {Math.abs(account.balanceDifference ?? 0) >
                              0.01 && (
                              <span className="text-xs text-emerald-600">
                                ● Real-time
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {account.apr ? `${account.apr}%` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {account.minPayment
                          ? `$${account.minPayment.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                            })}`
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {account.dueDay ? `Day ${account.dueDay}` : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(account.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
