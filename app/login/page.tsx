"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import {
  isDemoUser,
  validateDemoCredentials,
  createDemoSession,
} from "@/lib/demo-auth";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(""); // email or username
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // Check if demo account
      if (isDemoUser(identifier)) {
        if (validateDemoCredentials(identifier, password)) {
          createDemoSession();
          router.push("/");
          return;
        } else {
          setError("Invalid demo credentials");
          setLoading(false);
          return;
        }
      }

      // Regular authentication
      const isEmail = identifier.includes("@");
      if (isEmail) {
        const { error } = await authClient.signIn.email(
          { email: identifier, password, callbackURL: "/" },
          {
            onSuccess: () => router.push("/"),
          }
        );
        if (error) setError(error.message || "Login failed");
      } else {
        const { error } = await authClient.signIn.username(
          { username: identifier, password },
          {
            onSuccess: () => router.push("/"),
          }
        );
        if (error) setError(error.message || "Login failed");
      }
    } catch (err: any) {
      setError(err?.message ?? "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setIdentifier("test@test.com");
    setPassword("Test123456");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-6xl rounded-2xl border border-gray-800 bg-gray-950 p-2 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
          {/* Left: Image panel */}
          <div className="relative hidden lg:block rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
            <Image
              src="/Jan-Business_team_3.jpg"
              alt="People collaborating"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-gray-950/70 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-gray-200">
              <h3 className="text-2xl font-semibold">Welcome back</h3>
              <p className="mt-2 text-gray-300">
                Track expenses, manage cards, and stay on top of budgets.
              </p>
            </div>
          </div>

          {/* Right: Form */}
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-white">Sign in</h1>
              <p className="mt-2 text-sm text-gray-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-purple-400 hover:underline"
                >
                  Create one
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="identifier"
                  className="text-sm font-medium text-gray-300"
                >
                  Email or Username
                </label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="name@example.com or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-300"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-purple-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleDemoLogin}
                className="w-full border-purple-600 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40"
              >
                🎭 Try Demo Account
              </Button>
              <p className="mt-2 text-xs text-center text-gray-500">
                Uses local storage • No database access required
              </p>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-900 px-2 text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-800 bg-gray-900 text-gray-200 hover:bg-gray-800"
                onClick={() =>
                  authClient.signIn.social({
                    provider: "google",
                    callbackURL: "/",
                  })
                }
              >
                {/* Google */}
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-gray-800 bg-gray-900 text-gray-200 hover:bg-gray-800"
                onClick={() =>
                  authClient.signIn.social({
                    provider: "github",
                    callbackURL: "/",
                  })
                }
              >
                {/* GitHub */}
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M12 .5a11.5 11.5 0 0 0-3.63 22.41c.57.1.78-.25.78-.55v-2.14c-3.17.69-3.84-1.53-3.84-1.53-.52-1.33-1.27-1.68-1.27-1.68-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.67 1.24 3.32.95.1-.75.4-1.24.73-1.53-2.53-.29-5.2-1.27-5.2-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.15 1.17a10.9 10.9 0 0 1 5.74 0c2.19-1.48 3.15-1.17 3.15-1.17.62 1.58.23 2.75.11 3.04.73.8 1.18 1.82 1.18 3.07 0 4.4-2.67 5.37-5.22 5.65.41.35.77 1.04.77 2.1v3.12c0 .31.2.66.79.55A11.5 11.5 0 0 0 12 .5Z" />
                </svg>
                GitHub
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
