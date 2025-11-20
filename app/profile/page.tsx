"use client";

import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Save, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Storage, StorageKeys } from "@/lib/storage";
import type { AppSettings } from "@/lib/types";
import { useTheme } from "next-themes";

export default function ProfilePage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const { setTheme } = useTheme();
  // Load existing settings synchronously for initial state
  const existingSettings =
    typeof window !== "undefined"
      ? Storage.get<AppSettings>(StorageKeys.SETTINGS)
      : null;
  const [settings, setSettings] = useState<AppSettings>(
    existingSettings || {
      currency: "USD",
      firstDayOfWeek: 0,
      theme: "system",
    }
  );
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // Redirect unauthenticated
  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  // Sync theme with settings
  useEffect(() => {
    if (settings.theme) setTheme(settings.theme);
  }, [settings.theme, setTheme]);

  const handleSave = async () => {
    setSaving(true);
    Storage.set<AppSettings>(StorageKeys.SETTINGS, settings);
    if (settings.theme) setTheme(settings.theme);
    setSavedAt(new Date());
    setSaving(false);
  };

  if (isPending || !session) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <div className="h-24 w-24 mx-auto rounded-full bg-gray-800 animate-pulse" />
        <p className="mt-6 text-sm text-gray-400">Loading profile...</p>
      </div>
    );
  }

  interface ExtendedUser {
    id?: string;
    emailVerified?: boolean | null;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    username?: string | null;
  }
  const rawUser = session.user as unknown as ExtendedUser;
  const user: ExtendedUser = rawUser;

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-10">
      <div className="flex items-center gap-6">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || "User"}
            width={96}
            height={96}
            className="rounded-full border border-gray-800"
          />
        ) : (
          <div className="h-24 w-24 rounded-full bg-linear-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-3xl font-semibold">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">
            {user.name || "Profile"}
          </h1>
          <p className="text-gray-400 text-sm">{user.email}</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Account Details</h2>
        <div className="rounded-lg border border-gray-800 bg-gray-900 divide-y divide-gray-800">
          <dl className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
            <dt className="text-gray-400">Name</dt>
            <dd className="col-span-2 text-white">{user.name || "—"}</dd>
          </dl>
          <dl className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
            <dt className="text-gray-400">Email</dt>
            <dd className="col-span-2 text-white">{user.email}</dd>
          </dl>
          {user.username && (
            <dl className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
              <dt className="text-gray-400">Username</dt>
              <dd className="col-span-2 text-white">{user.username}</dd>
            </dl>
          )}
        </div>
      </div>

      {/* Identity Metadata (conditional) */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Identity Metadata</h2>
        <div className="rounded-lg border border-gray-800 bg-gray-900 divide-y divide-gray-800">
          {user.id && (
            <dl className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
              <dt className="text-gray-400">User ID</dt>
              <dd className="col-span-2 text-white break-all">{user.id}</dd>
            </dl>
          )}
          {user.emailVerified !== undefined && user.emailVerified !== null && (
            <dl className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
              <dt className="text-gray-400">Email Verified</dt>
              <dd className="col-span-2 text-white">
                {user.emailVerified ? "Yes" : "No"}
              </dd>
            </dl>
          )}
          {user.createdAt && (
            <dl className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
              <dt className="text-gray-400">Created</dt>
              <dd className="col-span-2 text-white">
                {new Date(user.createdAt).toLocaleString()}
              </dd>
            </dl>
          )}
          {user.updatedAt && (
            <dl className="grid grid-cols-3 gap-4 px-4 py-3 text-sm">
              <dt className="text-gray-400">Last Updated</dt>
              <dd className="col-span-2 text-white">
                {new Date(user.updatedAt).toLocaleString()}
              </dd>
            </dl>
          )}
        </div>
      </div>

      {/* App Settings */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          App Settings
        </h2>
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-6 space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, currency: e.target.value }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {[
                  "USD",
                  "EUR",
                  "GBP",
                  "CAD",
                  "AUD",
                  "JPY",
                  "INR",
                  "CNY",
                  "KRW",
                  "BRL",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                First Day of Week
              </label>
              <select
                value={settings.firstDayOfWeek}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    firstDayOfWeek: Number(e.target.value),
                  }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Theme</label>
              <select
                value={settings.theme}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    theme: e.target.value as AppSettings["theme"],
                  }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
            >
              {saving ? (
                <>
                  <Save className="h-4 w-4 animate-pulse" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" /> Save Settings
                </>
              )}
            </button>
            {savedAt && !saving && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <CheckCircle2 className="h-3 w-3" /> Saved{" "}
                {savedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={async () => {
            await authClient.signOut();
            router.push("/login");
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sign Out
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium bg-gray-800 hover:bg-gray-700 text-white transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
