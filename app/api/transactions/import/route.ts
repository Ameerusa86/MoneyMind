// app/api/transactions/import/route.ts
import { NextResponse, NextRequest } from "next/server";
import crypto from "crypto";

import { parseCsvTextToTransactions } from "@/lib/csv/parseTransactions";
import dbConnect from "@/lib/mongoose";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";
import { Account, Transaction } from "@/lib/models";

// Build a deterministic key per transaction for dedupe
function buildTransactionKey(args: {
  userId: string;
  date: string;
  amount: number;
  description?: string;
}) {
  const raw = [
    args.userId,
    args.date.trim(),
    args.amount.toFixed(2),
    (args.description || "").trim().toLowerCase(),
  ].join("||");

  return crypto.createHash("sha256").update(raw).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getAuthenticatedUser(req);
    if (!userId) return unauthorizedResponse();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const accountId = (formData.get("accountId") as string | null) || null;

    if (!file) {
      return errorResponse("No CSV file uploaded", 400);
    }

    const csvText = await file.text();

    // Fetch account type if accountId is provided
    let accountType: "checking" | "savings" | "credit" | "loan" = "checking";
    if (accountId) {
      const account = await Account.findOne({ _id: accountId, userId });
      if (!account) {
        return errorResponse("Invalid account ID", 400);
      }
      accountType = account.type as "checking" | "savings" | "credit" | "loan";
    }

    const rows = parseCsvTextToTransactions(csvText, { accountType });

    if (!rows.length) {
      const nonEmptyLines = csvText
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .filter((l) => l.trim().length > 0);

      if (nonEmptyLines.length === 1) {
        return errorResponse(
          "CSV contains only headers; add at least one data row",
          400
        );
      }

      return errorResponse(
        "CSV is empty, missing required columns (date,amount), or improperly formatted",
        400
      );
    }

    await dbConnect();

    // 1) Validate account IDs (from CSV + optional global accountId)
    const uniqueAccountIds = new Set<string>();
    rows.forEach((row) => {
      if (row.fromAccountId) uniqueAccountIds.add(row.fromAccountId);
      if (row.toAccountId) uniqueAccountIds.add(row.toAccountId);
    });
    if (accountId) uniqueAccountIds.add(accountId);

    if (uniqueAccountIds.size > 0) {
      const accountIds = Array.from(uniqueAccountIds);
      const accounts = await Account.find({
        _id: { $in: accountIds },
        userId,
      });

      if (accounts.length !== accountIds.length) {
        const foundIds = accounts.map((a) => a._id.toString());
        const missingIds = accountIds.filter((id) => !foundIds.includes(id));
        return errorResponse(
          `Invalid account IDs: ${missingIds.join(", ")}`,
          400
        );
      }
    }

    // 2) Build docs with deterministic transactionKey
    const docs = rows.map((row) => {
      let fromAccountId = row.fromAccountId;
      let toAccountId = row.toAccountId;

      // If a global accountId is provided, assign from/to based on transaction type
      if (accountId) {
        if (row.type === "expense") {
          // Expense: money OUT of the account
          fromAccountId = accountId;
        } else if (row.type === "income_deposit" || row.type === "payment") {
          // Income/deposit/payment: money INTO the account
          toAccountId = accountId;
        }
      }

      const transactionKey = buildTransactionKey({
        userId: userId.toString(),
        date: row.date,
        amount: row.amount, // Already positive from parser
        description: row.description,
      });

      return {
        userId: userId.toString(),
        transactionKey,
        type: row.type,
        fromAccountId,
        toAccountId,
        amount: row.amount, // Already positive
        date: row.date,
        description: row.description,
        category: row.category,
        metadata: row.metadata,
      };
    });

    // 3) Query existing keys for this user to avoid inserting duplicates
    const allKeys = docs.map((d) => d.transactionKey);
    const uniqueKeys = [...new Set(allKeys)];

    const existing = await Transaction.find({
      userId: userId.toString(),
      transactionKey: { $in: uniqueKeys },
    }).select("transactionKey");

    const existingKeySet = new Set(
      existing.map((e) => e.transactionKey as string)
    );

    const docsToInsert = docs.filter(
      (d) => !existingKeySet.has(d.transactionKey)
    );

    let insertedCount = 0;
    let balanceDelta = 0;

    if (docsToInsert.length) {
      const inserted = await Transaction.insertMany(docsToInsert, {
        ordered: false,
      });
      insertedCount = inserted.length;

      // 4) Adjust ONLY the selected account's balance, and only for relevant docs
      if (accountId) {
        const relevant = docsToInsert.filter(
          (d) => d.fromAccountId === accountId || d.toAccountId === accountId
        );

        // Calculate balance delta: incoming money (+) and outgoing money (-)
        balanceDelta = relevant.reduce((acc, d) => {
          if (d.toAccountId === accountId) {
            // Money coming IN (income/deposit)
            return acc + d.amount;
          } else if (d.fromAccountId === accountId) {
            // Money going OUT (expense)
            return acc - d.amount;
          }
          return acc;
        }, 0);

        if (balanceDelta !== 0) {
          await Account.findOneAndUpdate(
            { _id: accountId, userId },
            { $inc: { balance: balanceDelta } }
          );
        }
      }
    }

    const duplicatesSkipped = rows.length - docsToInsert.length;

    return NextResponse.json({
      ok: true,
      imported: insertedCount,
      attempted: rows.length,
      duplicatesSkipped,
      accountAdjusted: !!accountId,
      balanceDelta: accountId ? balanceDelta : undefined,
    });
  } catch (error: unknown) {
    console.error("CSV Import Error:", error);
    const message = error instanceof Error ? error.message : "Import failed";
    return errorResponse(message, 500);
  }
}
