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

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Income", href: "/income", icon: TrendingUp },
  { name: "Expenses", href: "/expenses", icon: TrendingDown },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Bills", href: "/bills", icon: Landmark },
  { name: "Planner", href: "/payment-planner", icon: CalendarDays },
  { name: "Credit Cards", href: "/credit-cards", icon: CreditCard },
  { name: "Loans", href: "/loans", icon: Landmark },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="border-b bg-gray-950 border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-purple-400" />
            <span className="text-xl font-bold text-gray-100">
              FinanceTracker
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
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
            {/* Theme toggle removed */}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-700">
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors text-gray-300 hover:bg-gray-800 hover:text-white"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors bg-purple-600 text-white hover:bg-purple-500"
              >
                <User className="h-4 w-4" />
                Register
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
                    <Wallet className="h-5 w-5 text-purple-400" />
                    Menu
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
                  {/* Theme toggle removed */}
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
