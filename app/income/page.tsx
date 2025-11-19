"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Storage, StorageKeys } from "@/lib/storage";
import { PaySchedule, PayFrequency } from "@/lib/types";

export default function IncomePage() {
  const [frequency, setFrequency] = useState<PayFrequency>("bi-weekly");
  const [nextPayDate, setNextPayDate] = useState("");
  const [amount, setAmount] = useState("");
  const [schedule, setSchedule] = useState<PaySchedule | null>(null);
  const [upcomingPayDates, setUpcomingPayDates] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Load existing schedule
    const saved = Storage.get<PaySchedule>(StorageKeys.PAY_SCHEDULE);
    if (saved) {
      setSchedule(saved);
      setFrequency(saved.frequency);
      setNextPayDate(saved.nextPayDate.split("T")[0]);
      setAmount(saved.typicalAmount.toString());
      calculateUpcomingPayDates(saved.nextPayDate, saved.frequency);
    }

    // Check storage version
    Storage.checkVersion();
  }, []);

  const calculateUpcomingPayDates = (
    startDate: string,
    freq: PayFrequency
  ): void => {
    const dates: string[] = [];
    const start = new Date(startDate);

    for (let i = 0; i < 3; i++) {
      const date = new Date(start);

      switch (freq) {
        case "weekly":
          date.setDate(date.getDate() + i * 7);
          break;
        case "bi-weekly":
          date.setDate(date.getDate() + i * 14);
          break;
        case "semi-monthly":
          // Simplified: 15 days apart
          date.setDate(date.getDate() + i * 15);
          break;
        case "monthly":
          date.setMonth(date.getMonth() + i);
          break;
      }

      dates.push(
        date.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      );
    }

    setUpcomingPayDates(dates);
  };

  const handleSave = () => {
    if (!nextPayDate || !amount) {
      alert("Please fill in all fields");
      return;
    }

    const now = new Date().toISOString();
    const newSchedule: PaySchedule = {
      id: schedule?.id || crypto.randomUUID(),
      frequency,
      nextPayDate: new Date(nextPayDate).toISOString(),
      typicalAmount: parseFloat(amount),
      createdAt: schedule?.createdAt || now,
      updatedAt: now,
    };

    Storage.set(StorageKeys.PAY_SCHEDULE, newSchedule);
    setSchedule(newSchedule);
    calculateUpcomingPayDates(newSchedule.nextPayDate, frequency);
    setIsSaved(true);

    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Income Schedule</h1>
          <p className="text-muted-foreground">
            Set up your pay frequency and schedule to track your income
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pay Schedule</CardTitle>
            <CardDescription>
              Configure when and how much you get paid
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pay Frequency</label>
              <Select
                value={frequency}
                onValueChange={(val) => setFrequency(val as PayFrequency)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="bi-weekly">
                    Bi-Weekly (Every 2 weeks)
                  </SelectItem>
                  <SelectItem value="semi-monthly">
                    Semi-Monthly (Twice per month)
                  </SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Next Pay Date</label>
              <Input
                type="date"
                value={nextPayDate}
                onChange={(e) => setNextPayDate(e.target.value)}
                placeholder="Select date"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Typical Net Amount ($)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <Button onClick={handleSave} className="w-full">
              {isSaved ? "Saved ✓" : "Save Schedule"}
            </Button>
          </CardContent>
        </Card>

        {upcomingPayDates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Pay Dates</CardTitle>
              <CardDescription>Your next 3 paychecks</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {upcomingPayDates.map((date, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <span className="font-medium">Paycheck #{index + 1}</span>
                    <span className="text-muted-foreground">{date}</span>
                  </li>
                ))}
              </ul>
              {schedule && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Expected Amount:</span>
                    <span className="text-lg font-bold text-green-600">
                      $
                      {schedule.typicalAmount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
