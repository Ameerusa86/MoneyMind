"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/navbar";

/**
 * Conditionally render Navbar based on the current route
 * Hide on auth pages (login, register)
 */
export function ConditionalNavbar() {
  const pathname = usePathname();

  // Hide navbar on auth pages
  const hideNavbarRoutes = ["/login", "/register", "/forgot-password"];
  const shouldHideNavbar = hideNavbarRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (shouldHideNavbar) {
    return null;
  }

  return <Navbar />;
}
