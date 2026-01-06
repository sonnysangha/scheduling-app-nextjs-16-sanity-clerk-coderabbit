"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
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
import { DAYS_OF_WEEK } from "../lib/constants";

interface CopyDayPopoverProps {
  onCopy: (dayIndex: number, includeWeekends: boolean) => void;
}

export function CopyDayPopover({ onCopy }: CopyDayPopoverProps) {
  const [open, setOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("0");
  const [includeWeekends, setIncludeWeekends] = useState(true);

  const handleCopy = () => {
    onCopy(Number(selectedDay), includeWeekends);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="max-sm:h-8 max-sm:w-8 max-sm:p-0"
        >
          <Copy className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">Copy</span>
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
              <Label htmlFor="include-weekends" className="text-sm font-normal">
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
  );
}
