import React from "react";
import { Table } from "@/components/ui/table";

interface ResponsiveTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  scrollX?: boolean;
}

// Wrapper to provide horizontal scroll on small screens and preserve table layout.
export function ResponsiveTable({
  children,
  scrollX = true,
  className,
  ...rest
}: ResponsiveTableProps) {
  return (
    <div
      className={
        "w-full " +
        (scrollX ? "overflow-x-auto -mx-2 md:mx-0 px-2 md:px-0" : "") +
        (className ? " " + className : "")
      }
      {...rest}
    >
      <div className="min-w-[640px] md:min-w-0">{children}</div>
    </div>
  );
}

// Optional compact row renderer for mobile (future use)
export function MobileOnly({ children }: { children: React.ReactNode }) {
  return <div className="md:hidden">{children}</div>;
}

export function DesktopOnly({ children }: { children: React.ReactNode }) {
  return <div className="hidden md:block">{children}</div>;
}
