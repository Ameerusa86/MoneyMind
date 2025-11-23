"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRightLeft } from "lucide-react";

type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
};

interface TransferDialogProps {
  trigger?: React.ReactNode;
  onTransferComplete?: () => void;
}

export function TransferDialog({
  trigger,
  onTransferComplete,
}: TransferDialogProps) {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      loadAccounts();
    }
  }, [open]);

  const loadAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      if (!res.ok) throw new Error("Failed to load accounts");
      const data = await res.json();
      const accountList = (data || []).map(
        (raw: {
          id?: string;
          _id?: string;
          name: string;
          type: string;
          balance?: number;
        }) => ({
          id: (raw.id || raw._id || "").toString(),
          name: raw.name,
          type: raw.type,
          balance: raw.balance || 0,
        })
      );
      setAccounts(accountList);
    } catch (err) {
      console.error(err);
      setError("Failed to load accounts");
    }
  };

  const resetForm = () => {
    setFromAccountId("");
    setToAccountId("");
    setAmount("");
    setDescription("");
    setError(null);
  };

  const handleTransfer = async () => {
    if (!fromAccountId || !toAccountId || !amount) {
      setError("Please fill in all required fields");
      return;
    }

    if (fromAccountId === toAccountId) {
      setError("Source and destination accounts must be different");
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "transfer",
          fromAccountId,
          toAccountId,
          amount: transferAmount,
          date: new Date().toISOString().split("T")[0],
          description: description || "Transfer between accounts",
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create transfer");
      }

      // Optionally update account balances via the balance endpoint
      // For now, balances are recalculated on page load

      resetForm();
      setOpen(false);
      if (onTransferComplete) {
        onTransferComplete();
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Transfer failed");
    } finally {
      setLoading(false);
    }
  };

  const fromAccount = accounts.find((a) => a.id === fromAccountId);
  const toAccount = accounts.find((a) => a.id === toAccountId);

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transfer
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Funds</DialogTitle>
          <DialogDescription>
            Move money between your accounts
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">From Account *</label>
            <Select value={fromAccountId} onValueChange={setFromAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select source account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name} ({account.type}) - $
                    {account.balance.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">To Account *</label>
            <Select value={toAccountId} onValueChange={setToAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination account" />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((a) => a.id !== fromAccountId)
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.type}) - $
                      {account.balance.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Amount *</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
            {fromAccount &&
              amount &&
              parseFloat(amount) > fromAccount.balance && (
                <p className="text-xs text-orange-600">
                  Warning: Transfer exceeds current balance
                </p>
              )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Description (Optional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Moving funds to savings"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {fromAccount && toAccount && amount && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium mb-1">Transfer Summary:</p>
              <p className="text-muted-foreground">
                ${parseFloat(amount).toFixed(2)} from {fromAccount.name} to{" "}
                {toAccount.name}
              </p>
            </div>
          )}

          <Button
            onClick={handleTransfer}
            disabled={
              loading ||
              !fromAccountId ||
              !toAccountId ||
              !amount ||
              fromAccountId === toAccountId
            }
            className="w-full"
          >
            {loading ? "Processing..." : "Complete Transfer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
