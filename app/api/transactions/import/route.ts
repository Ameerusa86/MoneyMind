import { NextResponse, NextRequest } from "next/server";
import { parseCsvTextToTransactions } from "@/lib/csv/parseTransactions";
import { Transaction, Account } from "@/lib/models";
import dbConnect from "@/lib/mongoose";
import {
  getAuthenticatedUser,
  unauthorizedResponse,
  errorResponse,
} from "@/lib/api-auth";

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
    const rows = parseCsvTextToTransactions(csvText);

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

    // Validate account IDs if provided or single accountId passed
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

    // Duplicate detection per bank spec: exact match on date + description + amount
    const keyFor = (r: (typeof rows)[number]) =>
      `${r.date}||${r.amount}||${(r.description || "").trim().toLowerCase()}`;

    const uniqueDates = [...new Set(rows.map((r) => r.date))];
    const uniqueAmounts = [...new Set(rows.map((r) => r.amount))];

    const existing = await Transaction.find({
      userId,
      date: { $in: uniqueDates },
      amount: { $in: uniqueAmounts },
    }).select("date amount description");

    const existingKeySet = new Set(
      existing.map(
        (e) =>
          `${e.date}||${e.amount}||${(e.description || "").trim().toLowerCase()}`
      )
    );

    const docs = rows
      .filter((r) => !existingKeySet.has(keyFor(r)))
      .map((row) => {
        // Assign accountId based on sign if provided globally
        let fromAccountId = row.fromAccountId;
        let toAccountId = row.toAccountId;
        if (accountId) {
          if (row.amount < 0) {
            fromAccountId = accountId;
          } else if (row.amount > 0) {
            toAccountId = accountId;
          }
        }
        return {
          userId,
          type: row.type,
          fromAccountId,
          toAccountId,
          amount: row.amount,
          date: row.date,
          description: row.description,
          category: row.category,
          metadata: row.metadata,
        };
      });

    let insertedCount = 0;
    let balanceDelta = 0;
    if (docs.length) {
      const inserted = await Transaction.insertMany(docs, { ordered: false });
      insertedCount = inserted.length;
      if (accountId) {
        balanceDelta = docs.reduce((acc, d) => acc + d.amount, 0);
        await Account.findOneAndUpdate(
          { _id: accountId, userId },
          { $inc: { balance: balanceDelta } }
        );
      }
    }

    const duplicatesSkipped = rows.length - docs.length;

    return NextResponse.json({
      ok: true,
      imported: insertedCount,
      attempted: rows.length,
      duplicatesSkipped,
      accountAdjusted: accountId ? true : false,
      balanceDelta: accountId ? balanceDelta : undefined,
    });
  } catch (error: unknown) {
    console.error("CSV Import Error:", error);
    const message = error instanceof Error ? error.message : "Import failed";
    return errorResponse(message, 500);
  }
}
