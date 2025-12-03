"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CalendarProps {
  selectedDate?: Date;
  onDateSelect: (date: Date) => void;
  availableDates?: Date[];
  className?: string;
  style: any;
}

export function Calendar({
  selectedDate,
  onDateSelect,
  availableDates = [],
}: CalendarProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date>(selectedDate || new Date());
  const [value, setValue] = React.useState(
    selectedDate ? formatDate(selectedDate) : ""
  );

  React.useEffect(() => {
    if (selectedDate) {
      setMonth(selectedDate);
      setValue(formatDate(selectedDate));
    }
  }, [selectedDate]);

  // FIX: Normalize dates to midnight in local timezone for comparison
  const normalizeDate = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const isDateAvailable = (date: Date) => {
    if (availableDates.length === 0) return true;
    const normalized = normalizeDate(date);
    return availableDates.some((d) => {
      const normalizedAvailable = normalizeDate(d);
      return (
        normalizedAvailable.getDate() === normalized.getDate() &&
        normalizedAvailable.getMonth() === normalized.getMonth() &&
        normalizedAvailable.getFullYear() === normalized.getFullYear()
      );
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    if (isDateAvailable(date)) {
      // FIX: Create a new date at midnight local time
      const localDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0,
        0,
        0,
        0
      );
      setValue(formatDate(localDate));
      onDateSelect(localDate);
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <Label htmlFor="date" className="px-1">
        Preferred Date <span className="text-red-500">*</span>
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative flex gap-2 w-full cursor-pointer">
            <Input
              id="date"
              value={value}
              placeholder="Select a date"
              readOnly
              onClick={() => setOpen(true)}
              className="
                bg-white dark:bg-gray-800
                text-black dark:text-white
                placeholder:text-black
                dark:placeholder:text-white
                pr-10 h-10.5
              "
            />

            <Button
              id="date-picker"
              variant="ghost"
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
            >
              <CalendarIcon className="size-4" />
              <span className="sr-only">Select date</span>
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={month}
            onMonthChange={setMonth}
            disabled={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              return (
                date < today ||
                (availableDates.length > 0 && !isDateAvailable(date))
              );
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function formatDate(date: Date | undefined) {
  if (!date) return "";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
