"use client";

import { useState } from "react";
import type { ToolbarProps, View } from "react-big-calendar";
import { ChevronLeft, ChevronRight, Copy, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CalendarEvent } from "./types";

const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

interface CustomToolbarProps {
  onCopyDayToWeek?: (dayIndex: number, includeWeekends: boolean) => void;
  onClearWeek?: () => void;
  showCopyButton?: boolean;
}

type CalendarToolbarProps = ToolbarProps<CalendarEvent, object> &
  CustomToolbarProps;

export function CalendarToolbar({
  label,
  onNavigate,
  onView,
  view,
  views,
  onCopyDayToWeek,
  onClearWeek,
  showCopyButton = false,
}: CalendarToolbarProps) {
  const [selectedDay, setSelectedDay] = useState<string>("0");
  const [includeWeekends, setIncludeWeekends] = useState(true);
  const [copyOpen, setCopyOpen] = useState(false);
  const viewOptions = Array.isArray(views) ? views : [];

  const handleCopy = () => {
    onCopyDayToWeek?.(Number(selectedDay), includeWeekends);
    setCopyOpen(false);
  };

  const handleClearWeek = () => {
    if (
      window.confirm("Are you sure you want to clear all events this week?")
    ) {
      onClearWeek?.();
    }
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      {/* Left: View switcher */}
      <div className="flex gap-1">
        {viewOptions.map((v) => (
          <Button
            key={v}
            variant={view === v ? "default" : "outline"}
            size="sm"
            onClick={() => onView(v as View)}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </Button>
        ))}
      </div>

      {/* Center: Current date label */}
      <span className="text-lg font-semibold">{label}</span>

      {/* Right: Actions + Navigation */}
      <div className="flex items-center gap-2">
        {showCopyButton && onCopyDayToWeek && (
          <Popover open={copyOpen} onOpenChange={setCopyOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Copy className="mr-1 h-4 w-4" />
                Copy
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Copy Day to Week</h4>
                  <p className="text-sm text-muted-foreground">
                    Copy a day's events to all other days.
                  </p>
                </div>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="day-select">Select day</Label>
                    <Select value={selectedDay} onValueChange={setSelectedDay}>
                      <SelectTrigger id="day-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day, index) => (
                          <SelectItem key={day} value={String(index)}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-weekends"
                      checked={includeWeekends}
                      onCheckedChange={(checked) =>
                        setIncludeWeekends(checked === true)
                      }
                    />
                    <Label
                      htmlFor="include-weekends"
                      className="text-sm font-normal"
                    >
                      Include weekends
                    </Label>
                  </div>
                  <Button onClick={handleCopy} className="w-full">
                    Copy to Week
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        {showCopyButton && onClearWeek && (
          <Button variant="destructive" size="sm" onClick={handleClearWeek}>
            <Trash2 className="mr-1 h-4 w-4" />
            Clear Week
          </Button>
        )}

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate("TODAY")}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onNavigate("PREV")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onNavigate("NEXT")}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
