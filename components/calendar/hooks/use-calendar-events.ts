"use client";

import { useState } from "react";
import { startOfDay, endOfDay, startOfWeek, addDays, set } from "date-fns";
import type { TimeBlock, TimeBlockInteraction, SlotInfo } from "../types";

// Helper: check if two blocks overlap or touch
const blocksOverlapOrTouch = (a: TimeBlock, b: TimeBlock): boolean =>
  a.start <= b.end && b.start <= a.end;

// Merge all overlapping/adjacent blocks
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
      last.end = new Date(Math.max(last.end.getTime(), current.end.getTime()));
      last.start = new Date(
        Math.min(last.start.getTime(), current.start.getTime())
      );
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
};

// Copy time from source date to target date
const copyTimeToDate = (source: Date, target: Date): Date =>
  set(target, {
    hours: source.getHours(),
    minutes: source.getMinutes(),
    seconds: source.getSeconds(),
  });

// Check if two block arrays are equal (by time only, not ID)
// IDs change from "local-xxx" to Sanity "_key" after save, so we compare by time
const blocksAreEqual = (a: TimeBlock[], b: TimeBlock[]): boolean => {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x.start.getTime() - y.start.getTime());
  const sortedB = [...b].sort((x, y) => x.start.getTime() - y.start.getTime());
  return sortedA.every(
    (block, i) =>
      block.start.getTime() === sortedB[i].start.getTime() &&
      block.end.getTime() === sortedB[i].end.getTime()
  );
};

export function useCalendarEvents(initialBlocks: TimeBlock[] = []) {
  // Current working state (includes unsaved changes)
  const [events, setEvents] = useState<TimeBlock[]>(initialBlocks);
  // What we consider "saved" - updated on save and on external updates
  const [savedBlocks, setSavedBlocks] = useState<TimeBlock[]>(initialBlocks);
  // Track previous initialBlocks to detect external changes
  const [prevInitial, setPrevInitial] = useState<TimeBlock[]>(initialBlocks);

  // Sync with Sanity Live updates
  if (!blocksAreEqual(initialBlocks, prevInitial)) {
    setPrevInitial(initialBlocks);
    setSavedBlocks(initialBlocks);
    // Only reset events if user has no local changes
    if (blocksAreEqual(events, savedBlocks)) {
      setEvents(initialBlocks);
    }
  }

  // Check if there are unsaved changes (compare with OUR saved state, not stale props)
  const hasChanges = !blocksAreEqual(events, savedBlocks);

  const addBlock = (start: Date, end: Date) => {
    const id = `local-${crypto.randomUUID()}`;
    const block: TimeBlock = { id, start, end };
    setEvents((prev) => mergeOverlappingBlocks([...prev, block]));
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

  const handleSelectSlot = ({ start, end }: SlotInfo) => {
    addBlock(start, end);
  };

  const handleEventDrop = ({ event, start, end }: TimeBlockInteraction) => {
    updateBlock(event.id, start, end);
  };

  const handleEventResize = ({ event, start, end }: TimeBlockInteraction) => {
    updateBlock(event.id, start, end);
  };

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
        const id = `local-${crypto.randomUUID()}`;
        const start = copyTimeToDate(block.start, targetDay);
        const end = copyTimeToDate(block.end, targetDay);
        newBlocks.push({ id, start, end });
      }
    }

    setEvents((prev) => mergeOverlappingBlocks([...prev, ...newBlocks]));
  };

  const clearWeek = (referenceDate: Date) => {
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);

    setEvents((prev) =>
      prev.filter((b) => b.start < weekStart || b.start >= weekEnd)
    );
  };

  // Discard all changes and revert to saved state
  const discardChanges = () => {
    setEvents(savedBlocks);
  };

  // Called after successful save - update both events and savedBlocks
  const markAsSaved = (newBlocks: TimeBlock[]) => {
    setEvents(newBlocks);
    setSavedBlocks(newBlocks);
  };

  // Get the current events for saving
  const getEventsForSave = () => events;

  return {
    events,
    hasChanges,
    addBlock,
    updateBlock,
    removeBlock,
    handleSelectSlot,
    handleEventDrop,
    handleEventResize,
    copyDayToWeek,
    clearWeek,
    discardChanges,
    markAsSaved,
    getEventsForSave,
  };
}
