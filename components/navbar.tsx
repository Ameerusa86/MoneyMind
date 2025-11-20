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
  Waves,
  BarChart3,
  ChevronDown,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type NavItem = { name: string; href: string; icon: any };

const financeItems: NavItem[] = [
  { name: "Income", href: "/income", icon: TrendingUp },
  { name: "Expenses", href: "/expenses", icon: TrendingDown },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Credit Cards", href: "/credit-cards", icon: CreditCard },
  { name: "Loans", href: "/loans", icon: Landmark },
  { name: "Bills", href: "/bills", icon: Landmark },
  { name: "Payment Planner", href: "/payment-planner", icon: CalendarDays },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => pathname === href;
  const isFinanceActive = financeItems.some((item) => pathname === item.href);

  return (
    <nav className="sticky top-0 z-40 border-b bg-gray-950/95 backdrop-blur-md border-gray-800">
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
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/")
                  ? "text-blue-400"
                  : "text-gray-300 hover:text-white"
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>

            {/* Finances Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors outline-none",
                  isFinanceActive
                    ? "text-blue-400"
                    : "text-gray-300 hover:text-white"
                )}
              >
                <Wallet className="h-4 w-4" />
                Finances
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-56 bg-gray-900 border-gray-800"
              >
                {financeItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 cursor-pointer",
                          isActive(item.href)
                            ? "bg-blue-600/20 text-blue-400"
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

            <Link
              href="/calendar"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/calendar")
                  ? "text-blue-400"
                  : "text-gray-300 hover:text-white"
              )}
            >
              <CalendarDays className="h-4 w-4" />
              Calendar
            </Link>

            <Link
              href="/reports"
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive("/reports")
                  ? "text-blue-400"
                  : "text-gray-300 hover:text-white"
              )}
            >
              <BarChart3 className="h-4 w-4" />
              Reports
            </Link>
          </div>

          {/* Right Section */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors text-gray-300 hover:text-white"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all bg-linear-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 hover:shadow-lg hover:shadow-purple-500/25"
            >
              <User className="h-4 w-4" />
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu */}
          <div className="flex md:hidden items-center gap-2">
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
                className="w-80 bg-gray-950 border-l border-gray-800"
              >
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-gray-100">
                    <Waves className="h-5 w-5 text-blue-400" />
                    WalletWave
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  <SheetClose asChild>
                    <Link
                      href="/"
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors",
                        isActive("/")
                          ? "bg-blue-600/20 text-blue-400"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Dashboard
                    </Link>
                  </SheetClose>

                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Finances
                  </div>
                  {financeItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors",
                            isActive(item.href)
                              ? "bg-blue-600/20 text-blue-400"
                              : "text-gray-300 hover:bg-gray-800 hover:text-white"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                          {item.name}
                        </Link>
                      </SheetClose>
                    );
                  })}

                  <div className="border-t border-gray-800 my-2" />

                  <SheetClose asChild>
                    <Link
                      href="/calendar"
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors",
                        isActive("/calendar")
                          ? "bg-blue-600/20 text-blue-400"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <CalendarDays className="h-5 w-5" />
                      Calendar
                    </Link>
                  </SheetClose>

                  <SheetClose asChild>
                    <Link
                      href="/reports"
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors",
                        isActive("/reports")
                          ? "bg-blue-600/20 text-blue-400"
                          : "text-gray-300 hover:bg-gray-800 hover:text-white"
                      )}
                    >
                      <BarChart3 className="h-5 w-5" />
                      Reports
                    </Link>
                  </SheetClose>

                  <div className="border-t border-gray-800 pt-4 mt-4 space-y-2">
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
                        className="flex items-center gap-3 px-4 py-3 rounded-md text-base font-medium transition-colors bg-linear-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500"
                      >
                        <User className="h-5 w-5" />
                        Sign Up
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
