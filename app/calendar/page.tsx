"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Landmark, Wallet, DollarSign } from "lucide-react";
import { AccountStorage, BillStorage, PayScheduleStorage } from "@/lib/storage";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function daysInGrid(current: Date) {
  const start = startOfMonth(current);
  const end = endOfMonth(current);
  const startDay = start.getDay(); // 0=Sun
  const days: Date[] = [];
  // Fill leading blanks
  for (let i = 0; i < startDay; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() - (startDay - i));
    days.push(d);
  }
  // Fill month days
  for (let d = 1; d <= end.getDate(); d++) {
    days.push(new Date(current.getFullYear(), current.getMonth(), d));
  }
  // Fill trailing blanks to complete rows of 7
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1];
    const next = new Date(last);
    next.setDate(next.getDate() + 1);
    days.push(next);
  }
  return days;
}

type CalendarEvent = {
  id: string;
  date: string; // ISO date
  type: "payday" | "bill" | "account";
  label: string;
  amount?: number;
};

function CalendarPageInner() {
  const [current, setCurrent] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcoming, setUpcoming] = useState<CalendarEvent[]>([]);

  // Load events whenever month changes
  React.useEffect(() => {
    const loadEvents = async () => {
      const year = current.getFullYear();
      const month = current.getMonth();

      const evts: CalendarEvent[] = [];

      // Paydays
      const [paydays, schedule, bills, accounts] = await Promise.all([
        PayScheduleStorage.getPaydaysForMonth(year, month),
        PayScheduleStorage.get(),
        BillStorage.getDueDatesForMonth(year, month),
        AccountStorage.getAll(),
      ]);

      for (const pd of paydays) {
        evts.push({
          id: `pay-${pd}`,
          date: pd,
          type: "payday",
          label: "Payday",
          amount: schedule?.typicalAmount,
        });
      }

      // Bills
      for (const b of bills) {
        evts.push({
          id: `bill-${b.id}`,
          date: b.date,
          type: "bill",
          label: b.name,
          amount: b.amount,
        });
      }

      // Account due days (credit/loan)
      accounts.forEach((a) => {
        if (a.dueDay) {
          const day = Math.min(Math.max(1, a.dueDay), 28);
          const date = new Date(year, month, day).toISOString();
          evts.push({
            id: `acct-${a.id}`,
            date,
            type: "account",
            label: `${a.name} Due`,
          });
        }
      });

      // Upcoming: next 14 days from today
      const today = new Date();
      const twoWeeks = new Date();
      twoWeeks.setDate(today.getDate() + 14);
      const upcomingList = evts
        .filter((e) => {
          const d = new Date(e.date);
          return d >= today && d <= twoWeeks;
        })
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      setEvents(evts);
      setUpcoming(upcomingList);
    };

    loadEvents();
  }, [current]);

  const gridDays = useMemo(() => daysInGrid(current), [current]);

  const dayEventsMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const key = new Date(e.date).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [events]);

  const monthLabel = current.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function changeMonth(delta: number) {
    const d = new Date(current);
    d.setMonth(d.getMonth() + delta);
    setCurrent(d);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Paydays and due dates at a glance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => changeMonth(-1)}>
            &larr; Prev
          </Button>
          <div className="px-4 py-2 text-sm text-gray-300">{monthLabel}</div>
          <Button variant="outline" onClick={() => changeMonth(1)}>
            Next &rarr;
          </Button>
        </div>
      </div>

      {/* Month Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Month View</CardTitle>
        </CardHeader>
        <CardContent>
          {
            <div className="grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="text-xs font-semibold text-muted-foreground px-2 py-1"
                >
                  {d}
                </div>
              ))}
              {gridDays.map((day, idx) => {
                const inMonth = day.getMonth() === current.getMonth();
                const key = day.toDateString();
                const dayEvts = dayEventsMap.get(key) || [];
                return (
                  <div
                    key={idx}
                    className={cn(
                      "rounded-lg border p-2 min-h-28",
                      inMonth
                        ? "border-gray-800"
                        : "border-gray-900 bg-gray-950/40"
                    )}
                  >
                    <div
                      className={cn(
                        "text-xs mb-1",
                        inMonth ? "text-gray-200" : "text-gray-500"
                      )}
                    >
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvts.slice(0, 3).map((e) => (
                        <div key={e.id} className="flex items-center gap-1">
                          {e.type === "payday" && (
                            <DollarSign className="h-3 w-3 text-emerald-400" />
                          )}
                          {e.type === "bill" && (
                            <Landmark className="h-3 w-3 text-purple-400" />
                          )}
                          {e.type === "account" && (
                            <Wallet className="h-3 w-3 text-sky-400" />
                          )}
                          <span className="text-xs truncate">
                            {e.type === "payday" ? "Payday" : e.label}
                          </span>
                        </div>
                      ))}
                      {dayEvts.length > 3 && (
                        <div className="text-[10px] text-muted-foreground">
                          +{dayEvts.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          }
        </CardContent>
      </Card>

      {/* Upcoming */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming (Next 14 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No upcoming items.
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((e) => {
                const d = new Date(e.date);
                const dateLabel = d.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between rounded-md border border-gray-800 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      {e.type === "payday" && (
                        <Badge className="bg-emerald-600">Payday</Badge>
                      )}
                      {e.type === "bill" && (
                        <Badge className="bg-purple-600">Bill</Badge>
                      )}
                      {e.type === "account" && (
                        <Badge className="bg-sky-600">Due</Badge>
                      )}
                      <div className="text-sm text-gray-200">{e.label}</div>
                    </div>
                    <div className="text-sm text-gray-400 flex items-center gap-3">
                      <span>{dateLabel}</span>
                      {typeof e.amount === "number" && (
                        <span>${e.amount.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const CalendarPage = dynamic(() => Promise.resolve(CalendarPageInner), {
  ssr: false,
});

export default CalendarPage;
