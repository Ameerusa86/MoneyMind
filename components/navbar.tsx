"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Landmark,
  Wallet,
  Menu,
  User,
  LogIn,
  CalendarDays,
  ChevronDown,
  Waves,
} from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Expenses", href: "/expenses", icon: TrendingDown },
  { name: "Calendar", href: "/calendar", icon: CalendarDays },
];

const financeItems = [
  { name: "Income", href: "/income", icon: TrendingUp },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Credit Cards", href: "/credit-cards", icon: CreditCard },
  { name: "Loans", href: "/loans", icon: Landmark },
  { name: "Bills", href: "/bills", icon: Landmark },
  { name: "Payment Planner", href: "/payment-planner", icon: CalendarDays },
  { name: "Reports", href: "/reports", icon: LineChartIcon },
];

function LineChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M3 3v18h18" />
      <polyline points="6 15 11 10 16 13 19 8" />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isFinanceActive = financeItems.some((item) => pathname === item.href);

  return (
    <nav className="border-b bg-gray-950 border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <Waves className="h-7 w-7 text-blue-400" />
            <span className="text-xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              WalletWave
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-purple-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}

            {/* Finances Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  isFinanceActive
                    ? "bg-purple-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                )}
              >
                <Wallet className="h-4 w-4" />
                Finances
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-950 border-gray-800">
                {financeItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 cursor-pointer",
                          isActive
                            ? "bg-purple-600 text-white"
                            : "text-gray-300 hover:bg-gray-800 hover:text-white"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-700">
              <Link
                href="/login"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-linear-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500"
              >
                <User className="h-4 w-4" />
                Sign Up
              </Link>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            {/* Theme toggle removed */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  className="p-2 text-gray-300 hover:bg-gray-800 rounded-md"
                  aria-label="Toggle menu"
                >
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-64 bg-gray-950 border-l border-gray-800"
              >
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-gray-100">
                    <Waves className="h-5 w-5 text-blue-400" />
                    WalletWave
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-8">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors",
                            isActive
                              ? "bg-purple-600 text-white"
                              : "text-gray-300 hover:bg-gray-800 hover:text-white"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          {item.name}
                        </Link>
                      </SheetClose>
                    );
                  })}

                  {/* Finances Section */}
                  <div className="mt-2">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Finances
                    </div>
                    {financeItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;

                      return (
                        <SheetClose asChild key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors",
                              isActive
                                ? "bg-purple-600 text-white"
                                : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            )}
                          >
                            <Icon className="h-5 w-5" />
                            {item.name}
                          </Link>
                        </SheetClose>
                      );
                    })}
                  </div>

                  <div className="border-t border-gray-700 pt-2 mt-2">
                    <SheetClose asChild>
                      <Link
                        href="/login"
                        className="flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors text-gray-300 hover:bg-gray-800 hover:text-white"
                      >
                        <LogIn className="h-5 w-5" />
                        Login
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/register"
                        className="flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors bg-purple-600 text-white hover:bg-purple-500 mt-2"
                      >
                        <User className="h-5 w-5" />
                        Register
                      </Link>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
