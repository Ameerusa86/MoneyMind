"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Upload, FileText } from "lucide-react";

interface ImportResult {
  ok: boolean;
  imported: number;
  attempted: number;
  duplicatesSkipped?: number;
  errors?: string[];
  accountAdjusted?: boolean;
  balanceDelta?: number;
}

interface TransactionRow {
  id: string;
  type: string;
  amount: number;
  date: string;
  description?: string;
  category?: string;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<TransactionRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [accountId, setAccountId] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/accounts");
        if (res.ok) {
          const data = await res.json();
          // Normalize id field
          setAccounts(
            (Array.isArray(data) ? data : []).map((a: any) => ({
              id: a.id || a._id,
              name: a.name || a.title || a._id || "Account",
            }))
          );
        }
      } catch {
        // silent
      }
    })();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] ?? null;
    setFile(selectedFile);
    setError(null);
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Please choose a CSV file.");
      return;
    }

    setError(null);
    setLoading(true);
    setResult(null);

    try {
      const form = new FormData();
      form.append("file", file);
      if (accountId) form.append("accountId", accountId);

      const res = await fetch("/api/transactions/import", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Import failed");
      } else {
        setResult(data);
        // Fetch latest imported transactions (most recent by date/createdAt)
        const listRes = await fetch("/api/transactions");
        if (listRes.ok) {
          const all = (await listRes.json()) as TransactionRow[];
          setPreview(all.slice(0, 10));
          setShowPreview(true);
        }
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="container max-w-3xl mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Import Transactions
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload a CSV file to bulk import transactions into your account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CSV File Format
          </CardTitle>
          <CardDescription>
            Your CSV file should include the following columns:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md">
            <code className="text-sm">
              date,type,amount,description,category,fromAccountId,toAccountId,metadata
            </code>
          </div>
          <div className="mt-4 space-y-2 text-sm text-muted-foreground">
            <p>
              • <strong>date</strong>: ISO date format (YYYY-MM-DD)
            </p>
            <p>
              • <strong>type</strong>: income_deposit, payment, expense,
              transfer, or adjustment
            </p>
            <p>
              • <strong>amount</strong>: Numeric value
            </p>
            <p>
              • <strong>description</strong>: Optional text description
            </p>
            <p>
              • <strong>category</strong>: Optional category name
            </p>
            <p>
              • <strong>fromAccountId</strong>: Optional source account ID
            </p>
            <p>
              • <strong>toAccountId</strong>: Optional destination account ID
            </p>
            <p>
              • <strong>metadata</strong>: Optional JSON object
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV File</CardTitle>
          <CardDescription>
            Select a CSV file from your computer to import transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <label
                htmlFor="csv-upload"
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md cursor-pointer hover:bg-secondary/80 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Choose File
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              {file && (
                <span className="text-sm text-muted-foreground">
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </span>
              )}
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Account (optional):
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="text-xs px-2 py-1 rounded border bg-background"
                >
                  <option value="">None</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading || !file}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Import CSV
                  </>
                )}
              </Button>

              {(file || result || error) && (
                <Button type="button" variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-semibold text-green-700 dark:text-green-400">
                Import Completed Successfully!
              </p>
              <p>
                Imported <strong>{result.imported}</strong> /{" "}
                <strong>{result.attempted}</strong> rows.
              </p>
              {typeof result.duplicatesSkipped === "number" && (
                <p className="text-sm text-muted-foreground">
                  Duplicates skipped: {result.duplicatesSkipped}
                </p>
              )}
              {result.accountAdjusted && (
                <p className="text-sm text-muted-foreground">
                  Account balance adjusted by {result.balanceDelta?.toFixed(2)}
                </p>
              )}
              {result.imported < result.attempted && (
                <p className="text-xs text-muted-foreground">
                  Some rows skipped due to validation or duplication.
                </p>
              )}
              {showPreview && preview.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">
                    Latest Transactions (top 10)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border border-gray-200 dark:border-gray-800 rounded-md">
                      <thead className="bg-gray-100 dark:bg-gray-800">
                        <tr>
                          <th className="px-2 py-1 text-left">Date</th>
                          <th className="px-2 py-1 text-left">Type</th>
                          <th className="px-2 py-1 text-left">Description</th>
                          <th className="px-2 py-1 text-left">Category</th>
                          <th className="px-2 py-1 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((t) => (
                          <tr
                            key={t.id}
                            className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-950"
                          >
                            <td className="px-2 py-1">{t.date}</td>
                            <td className="px-2 py-1 uppercase tracking-wide font-semibold">
                              {t.type}
                            </td>
                            <td
                              className="px-2 py-1 max-w-40 truncate"
                              title={t.description}
                            >
                              {t.description || "—"}
                            </td>
                            <td className="px-2 py-1">{t.category || "—"}</td>
                            <td className="px-2 py-1 text-right font-mono">
                              {t.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
