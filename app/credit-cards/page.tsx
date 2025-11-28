"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  CreditCard,
  Calendar,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AccountStorage } from "@/lib/storage";
import { Account } from "@/lib/types";

export default function CreditCardsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Add Card form state
  const [cardName, setCardName] = useState("");
  const [cardLast4, setCardLast4] = useState("");
  const [cardLimit, setCardLimit] = useState("");
  const [cardBalance, setCardBalance] = useState("");
  const [cardDueDate, setCardDueDate] = useState("");
  const [cardApr, setCardApr] = useState("");
  const [creditCards, setCreditCards] = useState<
    Array<Account & { calculatedBalance?: number; balanceDifference?: number }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  // Edit Card state
  const [editingCard, setEditingCard] = useState<Account | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLimit, setEditLimit] = useState("");
  const [editBalance, setEditBalance] = useState("");
  const [editDueDay, setEditDueDay] = useState("");
  const [editApr, setEditApr] = useState("");
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "due_7" | "high_util" | "med_util" | "low_util"
  >("all");

  useEffect(() => {
    const loadCreditCards = async () => {
      try {
        const accounts = await AccountStorage.getAllWithBalances();
        const cards = accounts.filter((acc) => acc.type === "credit");
        setCreditCards(cards);
      } catch (error) {
        console.error("Failed to load credit cards:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCreditCards();
  }, []);

  const getCurrentBalance = (card: Account & { calculatedBalance?: number }) =>
    card.calculatedBalance ?? card.balance;

  const getDaysUntilDue = (card: Account) => {
    if (!card.dueDay) return null;
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    let dueDate = new Date(currentYear, currentMonth, card.dueDay);
    if (dueDate < today) {
      dueDate = new Date(currentYear, currentMonth + 1, card.dueDay);
    }
    return Math.ceil(
      (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  // Apply search + filter
  const filteredCards = creditCards.filter((card) => {
    const nameOk = card.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!nameOk) return false;
    const current = getCurrentBalance(card);
    const util = card.creditLimit ? (current / card.creditLimit) * 100 : 0;
    switch (filter) {
      case "due_7": {
        const d = getDaysUntilDue(card);
        return d !== null && d <= 7;
      }
      case "high_util":
        return util > 70;
      case "med_util":
        return util >= 30 && util <= 70;
      case "low_util":
        return util < 30;
      default:
        return true;
    }
  });

  const totalBalance = filteredCards.reduce(
    (sum, card) => sum + getCurrentBalance(card),
    0
  );
  const totalLimit = filteredCards.reduce(
    (sum, card) => sum + (card.creditLimit || 0),
    0
  );
  const utilizationRate =
    totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

  const resetAddForm = () => {
    setCardName("");
    setCardLast4("");
    setCardLimit("");
    setCardBalance("");
    setCardDueDate("");
    setCardApr("");
    setErrorMsg(null);
  };

  const handleAddCard = async () => {
    setErrorMsg(null);
    // Basic validation
    if (!cardName.trim()) {
      setErrorMsg("Card name is required");
      return;
    }
    const balanceNum = Number(cardBalance || 0);
    if (!Number.isFinite(balanceNum)) {
      setErrorMsg("Balance must be a number");
      return;
    }
    const limitNum = cardLimit ? Number(cardLimit) : undefined;
    if (cardLimit && !Number.isFinite(Number(cardLimit))) {
      setErrorMsg("Credit limit must be a number");
      return;
    }
    const aprNum = cardApr ? Number(cardApr) : undefined;
    if (cardApr && !Number.isFinite(Number(cardApr))) {
      setErrorMsg("APR must be a number");
      return;
    }
    let dueDayNum: number | undefined = undefined;
    if (cardDueDate) {
      const d = new Date(cardDueDate);
      if (!isNaN(d.getTime())) {
        dueDayNum = d.getDate();
      }
    }

    const nameWithLast4 = cardLast4
      ? `${cardName.trim()} •••• ${cardLast4.trim()}`
      : cardName.trim();

    setIsSaving(true);
    try {
      const created = await AccountStorage.add({
        name: nameWithLast4,
        type: "credit",
        balance: balanceNum,
        creditLimit: limitNum,
        apr: aprNum,
        dueDay: dueDayNum,
      });
      if (!created) {
        setErrorMsg("Failed to add credit card");
        return;
      }
      setCreditCards((prev) => [created, ...prev]);
      resetAddForm();
      setIsDialogOpen(false);
    } catch (e) {
      setErrorMsg("Unexpected error adding card");
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (card: Account) => {
    setEditingCard(card);
    setEditName(card.name);
    setEditLimit(card.creditLimit != null ? String(card.creditLimit) : "");
    setEditBalance(String(card.balance));
    setEditDueDay(card.dueDay != null ? String(card.dueDay) : "");
    setEditApr(card.apr != null ? String(card.apr) : "");
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingCard) return;
    setEditError(null);
    if (!editName.trim()) {
      setEditError("Card name is required");
      return;
    }
    const updates: Partial<Account> = {} as Partial<Account>;
    updates.name = editName.trim();
    const bal = Number(editBalance || 0);
    if (!Number.isFinite(bal)) {
      setEditError("Balance must be a number");
      return;
    }
    updates.balance = bal;
    if (editLimit !== "") {
      const lim = Number(editLimit);
      if (!Number.isFinite(lim)) {
        setEditError("Credit limit must be a number");
        return;
      }
      updates.creditLimit = lim;
    } else {
      updates.creditLimit = undefined;
    }
    if (editApr !== "") {
      const a = Number(editApr);
      if (!Number.isFinite(a)) {
        setEditError("APR must be a number");
        return;
      }
      updates.apr = a;
    } else {
      updates.apr = undefined;
    }
    if (editDueDay !== "") {
      const dd = Number(editDueDay);
      if (!Number.isFinite(dd) || dd < 1 || dd > 31) {
        setEditError("Due day must be between 1 and 31");
        return;
      }
      updates.dueDay = dd;
    } else {
      updates.dueDay = undefined;
    }

    setEditSaving(true);
    try {
      const updated = await AccountStorage.update(editingCard.id, updates);
      if (!updated) {
        setEditError("Failed to update card");
        return;
      }
      setCreditCards((prev) =>
        prev.map((c) => (c.id === editingCard.id ? updated : c))
      );
      setIsEditOpen(false);
      setEditingCard(null);
    } catch (e) {
      setEditError("Unexpected error updating card");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Cards</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your credit cards and track balances
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetAddForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Card
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Credit Card</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Card Name
                </label>
                <Input
                  placeholder="e.g., Chase Sapphire"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Last 4 Digits
                </label>
                <Input
                  placeholder="1234"
                  maxLength={4}
                  value={cardLast4}
                  onChange={(e) =>
                    setCardLast4(e.target.value.replace(/[^0-9]/g, ""))
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Credit Limit
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={cardLimit}
                  onChange={(e) => setCardLimit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Current Balance
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={cardBalance}
                  onChange={(e) => setCardBalance(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={cardDueDate}
                  onChange={(e) => setCardDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Interest Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cardApr}
                  onChange={(e) => setCardApr(e.target.value)}
                />
              </div>
              {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
              <Button
                className="w-full"
                onClick={handleAddCard}
                disabled={isSaving}
              >
                {isSaving ? "Adding..." : "Add Credit Card"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter</label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cards</SelectItem>
                  <SelectItem value="due_7">Due within 7 days</SelectItem>
                  <SelectItem value="high_util">
                    High utilization (&gt; 70%)
                  </SelectItem>
                  <SelectItem value="med_util">
                    Medium utilization (30–70%)
                  </SelectItem>
                  <SelectItem value="low_util">
                    Low utilization (&lt; 30%)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end justify-end text-sm text-muted-foreground">
              Showing {filteredCards.length} of {creditCards.length}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Across {creditCards.length} cards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Credit Limit
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalLimit)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Available credit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Utilization Rate
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {utilizationRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {utilizationRate < 30 ? "Good" : "Consider paying down"}
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading credit cards...
        </div>
      ) : creditCards.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <CreditCard className="h-16 w-16 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold mb-2">
                No Credit Cards Yet
              </h3>
              <p className="text-muted-foreground mb-4">
                Add your credit cards to track balances and utilization
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Credit Card
              </Button>
            </div>
          </div>
        </Card>
      ) : filteredCards.length === 0 ? (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            No cards match your search/filters.
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCards.map((card) => {
            const current = getCurrentBalance(card);
            const utilization = card.creditLimit
              ? (current / card.creditLimit) * 100
              : 0;
            const daysUntilDue = getDaysUntilDue(card);

            return (
              <Card key={card.id} className="overflow-hidden">
                <div className="bg-linear-to-br from-blue-600 to-purple-600 p-6 text-white">
                  <div className="flex items-start justify-between mb-8">
                    <CreditCard className="h-8 w-8" />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEdit(card)}
                    >
                      Edit
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-bold">{card.name}</p>
                  </div>
                </div>

                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Balance
                      </span>
                      <span className="font-bold text-orange-600">
                        {formatCurrency(current)}
                      </span>
                    </div>
                    {card.calculatedBalance !== undefined &&
                      Math.abs((card.calculatedBalance ?? 0) - card.balance) >
                        0.01 && (
                        <p className="text-xs text-emerald-600 text-right">
                          ● Real-time (opening {formatCurrency(card.balance)})
                        </p>
                      )}
                    {card.creditLimit && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Credit Limit
                          </span>
                          <span className="font-medium">
                            {formatCurrency(card.creditLimit)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              utilization > 70
                                ? "bg-red-600"
                                : utilization > 30
                                  ? "bg-yellow-600"
                                  : "bg-green-600"
                            }`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {utilization.toFixed(1)}% utilized
                        </p>
                      </>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    {card.dueDay && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          Due Day
                        </div>
                        <span className="font-medium">Day {card.dueDay}</span>
                      </div>
                    )}
                    {card.minPayment && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Min Payment
                        </span>
                        <span className="font-medium">
                          {formatCurrency(card.minPayment)}
                        </span>
                      </div>
                    )}
                    {card.apr && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          APR
                        </span>
                        <span className="font-medium">{card.apr}%</span>
                      </div>
                    )}
                    {daysUntilDue !== null && daysUntilDue <= 7 && (
                      <Badge
                        variant="destructive"
                        className="w-full justify-center"
                      >
                        Due in {daysUntilDue} days
                      </Badge>
                    )}
                    {card.website && (
                      <a
                        href={card.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="w-full" variant="outline" size="sm">
                          Visit Website
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {/* Edit Card Modal */}
          <Dialog
            open={isEditOpen}
            onOpenChange={(open) => {
              setIsEditOpen(open);
              if (!open) setEditingCard(null);
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Credit Card</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Card Name
                  </label>
                  <Input
                    placeholder="Card name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Credit Limit
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={editLimit}
                    onChange={(e) => setEditLimit(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Current Balance
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={editBalance}
                    onChange={(e) => setEditBalance(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Due Day (1-31)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    placeholder="e.g., 15"
                    value={editDueDay}
                    onChange={(e) => setEditDueDay(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    APR (%)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={editApr}
                    onChange={(e) => setEditApr(e.target.value)}
                  />
                </div>
                {editError && (
                  <p className="text-sm text-red-600">{editError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => setIsEditOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="w-full"
                    onClick={handleEditSave}
                    disabled={editSaving}
                  >
                    {editSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
