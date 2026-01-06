"use client";

import type { ToolbarProps, View } from "react-big-calendar";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyDayPopover } from "./copy-day-popover";
import type { TimeBlock } from "../types";

interface CustomToolbarProps {
  onCopyDayToWeek?: (dayIndex: number, includeWeekends: boolean) => void;
  onClearWeek?: () => void;
  showCopyButton?: boolean;
}

type CalendarToolbarProps = ToolbarProps<TimeBlock, object> &
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
  const viewOptions = Array.isArray(views) ? views : [];

  const handleClearWeek = () => {
    if (
      window.confirm("Are you sure you want to clear all events this week?")
    ) {
      onClearWeek?.();
    }
  };

  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      {/* Left: View switcher */}
      <div className="flex gap-1">
        {viewOptions.map((v) => (
          <Button
            key={v}
            variant={view === v ? "default" : "outline"}
            size="sm"
            onClick={() => onView(v as View)}
            className="max-sm:h-8 max-sm:w-8 max-sm:p-0"
          >
            <span className="hidden sm:inline">
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </span>
            <span className="sm:hidden">{v.charAt(0).toUpperCase()}</span>
          </Button>
        ))}
      </div>

      {/* Center: Current date label */}
      <span className="text-lg font-semibold max-sm:text-sm">{label}</span>

      {/* Right: Actions + Navigation */}
      <div className="flex items-center gap-2">
        {showCopyButton && (
          <div className="flex items-center gap-1">
            {onCopyDayToWeek && <CopyDayPopover onCopy={onCopyDayToWeek} />}

            {onClearWeek && (
              <Button
                variant="destructive"
                size="sm"
                className="max-sm:h-8 max-sm:w-8 max-sm:p-0"
                onClick={handleClearWeek}
              >
                <Trash2 className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Clear Week</span>
              </Button>
            )}
          </div>
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
