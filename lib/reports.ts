import { ExpenseStorage, PayScheduleStorage, AccountStorage } from "./storage";

// Utility: get last N months year/month pairs (including current)
function getLastMonths(count: number): Array<{ year: number; month: number }> {
  const now = new Date();
  const months: Array<{ year: number; month: number }> = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return months.reverse(); // chronological
}

export interface MonthlyTotalPoint {
  label: string; // e.g. Aug 2025
  value: number;
  year: number;
  month: number;
}

export function getMonthlyExpenseTotals(
  monthCount: number
): MonthlyTotalPoint[] {
  return getLastMonths(monthCount).map(({ year, month }) => {
    const expenses = ExpenseStorage.getByMonth(year, month);
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    return {
      label: new Date(year, month, 1).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      }),
      value: total,
      year,
      month,
    };
  });
}

// Income estimation based on pay schedule typical amount * paydays per month
export function getMonthlyIncomeTotals(
  monthCount: number
): MonthlyTotalPoint[] {
  const schedule = PayScheduleStorage.get();
  return getLastMonths(monthCount).map(({ year, month }) => {
    const paydays = PayScheduleStorage.getPaydaysForMonth(year, month).length;
    const total = (schedule?.typicalAmount || 0) * paydays;
    return {
      label: new Date(year, month, 1).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      }),
      value: total,
      year,
      month,
    };
  });
}

export interface CategorySeriesPoint {
  label: string;
  categoryTotals: Record<string, number>; // category -> value
  year: number;
  month: number;
}

export function getMonthlyCategoryBreakdown(
  monthCount: number
): CategorySeriesPoint[] {
  return getLastMonths(monthCount).map(({ year, month }) => {
    const breakdown = ExpenseStorage.getCategoryBreakdown(year, month);
    return {
      label: new Date(year, month, 1).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      }),
      categoryTotals: breakdown,
      year,
      month,
    };
  });
}

// Net worth (current snapshot only; historical requires transaction history not yet implemented)
export function getCurrentNetWorth(): {
  assets: number;
  liabilities: number;
  netWorth: number;
  savings: number;
} {
  const accounts = AccountStorage.getAll();
  let assets = 0;
  let liabilities = 0;
  let savings = 0;
  for (const a of accounts) {
    if (a.type === "credit" || a.type === "loan") {
      liabilities += a.balance;
    } else {
      assets += a.balance;
      if (a.type === "savings") savings += a.balance;
    }
  }
  return { assets, liabilities, netWorth: assets - liabilities, savings };
}

export function getSavingsRate(): number {
  const now = new Date();
  const income = getMonthlyIncomeTotals(1)[0]?.value || 0;
  const expenses = getMonthlyExpenseTotals(1)[0]?.value || 0;
  if (income <= 0) return 0;
  const savings = income - expenses;
  return savings / income; // fraction (0-1)
}

// CSV helpers
function toCSV(rows: string[][]): string {
  return rows
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export function exportIncomeVsExpenseCSV(monthCount: number): string {
  const income = getMonthlyIncomeTotals(monthCount);
  const expenses = getMonthlyExpenseTotals(monthCount);
  const header = ["Month", "Income", "Expenses", "Net"];
  const rows = income.map((inc, idx) => {
    const exp = expenses[idx];
    return [
      inc.label,
      inc.value.toFixed(2),
      exp.value.toFixed(2),
      (inc.value - exp.value).toFixed(2),
    ];
  });
  return toCSV([header, ...rows]);
}

export function exportCategoryTrendsCSV(monthCount: number): string {
  const series = getMonthlyCategoryBreakdown(monthCount);
  // Collect all categories across months
  const categories = Array.from(
    new Set(series.flatMap((p) => Object.keys(p.categoryTotals)))
  ).sort();
  const header = ["Month", ...categories];
  const rows = series.map((p) => [
    p.label,
    ...categories.map((c) => (p.categoryTotals[c] || 0).toFixed(2)),
  ]);
  return toCSV([header, ...rows]);
}
