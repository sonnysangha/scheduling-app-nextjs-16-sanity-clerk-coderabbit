"use client";

import { useState } from "react";
import { startOfDay, endOfDay, startOfWeek, addDays, set } from "date-fns";
import type { TimeBlock, TimeBlockInteraction, SlotInfo } from "../types";

// Helper: check if two blocks overlap or touch
const blocksOverlapOrTouch = (a: TimeBlock, b: TimeBlock): boolean =>
  a.start <= b.end && b.start <= a.end;

// Merge all overlapping/adjacent blocks on the same day
const mergeOverlappingBlocks = (blocks: TimeBlock[]): TimeBlock[] => {
  if (blocks.length < 2) return blocks;

  const sorted = [...blocks].sort(
    (a, b) => a.start.getTime() - b.start.getTime()
  );
  const merged: TimeBlock[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (blocksOverlapOrTouch(last, current)) {
      // Extend the last block to cover both
      last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
};

export function useCalendarEvents(initialBlocks: TimeBlock[] = []) {
  const [events, setEvents] = useState<TimeBlock[]>(initialBlocks);

  const addBlock = (start: Date, end: Date): TimeBlock => {
    const block: TimeBlock = {
      id: crypto.randomUUID(),
      start,
      end,
    };
    setEvents((prev) => mergeOverlappingBlocks([...prev, block]));
    return block;
  };

  const updateBlock = (id: string, start: Date, end: Date) => {
    setEvents((prev) =>
      mergeOverlappingBlocks(
        prev.map((b) => (b.id === id ? { ...b, start, end } : b))
      )
    );
  };

  const removeBlock = (id: string) => {
    setEvents((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSelectSlot = ({ start, end }: SlotInfo) => addBlock(start, end);

  const handleEventDrop = ({ event, start, end }: TimeBlockInteraction) =>
    updateBlock(event.id, start, end);

  const handleEventResize = ({ event, start, end }: TimeBlockInteraction) =>
    updateBlock(event.id, start, end);

  // Copy time from source date to target date
  const copyTimeToDate = (source: Date, target: Date): Date =>
    set(target, {
      hours: source.getHours(),
      minutes: source.getMinutes(),
      seconds: source.getSeconds(),
    });

  // Copy all blocks from a specific day (by index 0-6) to other days of the week
  const copyDayToWeek = (
    dayIndex: number,
    referenceDate: Date,
    includeWeekends = true
  ) => {
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
    const sourceDay = addDays(weekStart, dayIndex);
    const dayStart = startOfDay(sourceDay);
    const dayEnd = endOfDay(sourceDay);

    const dayBlocks = events.filter(
      (b) => b.start >= dayStart && b.start <= dayEnd
    );

    if (dayBlocks.length === 0) return;

    const newBlocks: TimeBlock[] = [];

    for (let i = 0; i < 7; i++) {
      if (i === dayIndex) continue;
      if (!includeWeekends && (i === 5 || i === 6)) continue;

      const targetDay = addDays(weekStart, i);

      for (const block of dayBlocks) {
        newBlocks.push({
          id: crypto.randomUUID(),
          start: copyTimeToDate(block.start, targetDay),
          end: copyTimeToDate(block.end, targetDay),
        });
      }
    }

    setEvents((prev) => mergeOverlappingBlocks([...prev, ...newBlocks]));
  };

  // Clear all blocks in the week containing referenceDate
  const clearWeek = (referenceDate: Date) => {
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);

    setEvents((prev) =>
      prev.filter((b) => b.start < weekStart || b.start >= weekEnd)
    );
  };

  return {
    events,
    addBlock,
    updateBlock,
    removeBlock,
    handleSelectSlot,
    handleEventDrop,
    handleEventResize,
    copyDayToWeek,
    clearWeek,
  };
}
