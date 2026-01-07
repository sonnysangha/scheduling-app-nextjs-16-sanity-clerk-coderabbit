"use client";

import { useState, useOptimistic, useTransition, useCallback } from "react";
import { startOfDay, endOfDay, startOfWeek, addDays, set } from "date-fns";
import type { TimeBlock, TimeBlockInteraction, SlotInfo } from "../types";
import {
  saveAvailabilityBlock,
  deleteAvailabilityBlock,
  updateAvailabilityBlock,
  bulkSaveAvailabilityBlocks,
  bulkDeleteAvailabilityBlocks,
} from "@/lib/actions/availability";

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

type OptimisticAction =
  | { type: "add"; block: TimeBlock }
  | { type: "remove"; id: string }
  | { type: "update"; block: TimeBlock }
  | { type: "bulkAdd"; blocks: TimeBlock[] }
  | { type: "bulkRemove"; ids: string[] };

export function useCalendarEvents(initialBlocks: TimeBlock[] = []) {
  const [events, setEvents] = useState<TimeBlock[]>(initialBlocks);
  const [isPending, startTransition] = useTransition();

  // Optimistic state for instant UI feedback
  const [optimisticEvents, addOptimistic] = useOptimistic(
    events,
    (state: TimeBlock[], action: OptimisticAction) => {
      switch (action.type) {
        case "add":
          return mergeOverlappingBlocks([...state, action.block]);
        case "remove":
          return state.filter((b) => b.id !== action.id);
        case "update":
          return mergeOverlappingBlocks(
            state.map((b) => (b.id === action.block.id ? action.block : b))
          );
        case "bulkAdd":
          return mergeOverlappingBlocks([...state, ...action.blocks]);
        case "bulkRemove":
          return state.filter((b) => !action.ids.includes(b.id));
        default:
          return state;
      }
    }
  );

  const addBlock = useCallback(
    async (start: Date, end: Date): Promise<TimeBlock> => {
      const tempId = `temp-${crypto.randomUUID()}`;
      const block: TimeBlock = { id: tempId, start, end };

      // Optimistic update - instant UI feedback
      startTransition(() => {
        addOptimistic({ type: "add", block });
      });

      // Also update local state immediately for merging
      setEvents((prev) => mergeOverlappingBlocks([...prev, block]));

      // Persist to Sanity
      try {
        const { realKey } = await saveAvailabilityBlock({ tempId, start, end });
        // Replace temp ID with real key
        setEvents((prev) =>
          prev.map((b) => (b.id === tempId ? { ...b, id: realKey } : b))
        );
        return { ...block, id: realKey };
      } catch (error) {
        // Rollback on error
        setEvents((prev) => prev.filter((b) => b.id !== tempId));
        console.error("Failed to save block:", error);
        throw error;
      }
    },
    [addOptimistic]
  );

  const updateBlock = useCallback(
    async (id: string, start: Date, end: Date): Promise<void> => {
      const updatedBlock: TimeBlock = { id, start, end };

      // Optimistic update
      startTransition(() => {
        addOptimistic({ type: "update", block: updatedBlock });
      });

      // Store previous state for rollback
      const previousBlock = events.find((b) => b.id === id);

      // Update local state
      setEvents((prev) =>
        mergeOverlappingBlocks(
          prev.map((b) => (b.id === id ? { ...b, start, end } : b))
        )
      );

      // Skip persistence for temp blocks (haven't been saved yet)
      if (id.startsWith("temp-")) return;

      try {
        await updateAvailabilityBlock({ key: id, start, end });
      } catch (error) {
        // Rollback on error
        if (previousBlock) {
          setEvents((prev) =>
            prev.map((b) => (b.id === id ? previousBlock : b))
          );
        }
        console.error("Failed to update block:", error);
        throw error;
      }
    },
    [addOptimistic, events]
  );

  const removeBlock = useCallback(
    async (id: string): Promise<void> => {
      const block = events.find((b) => b.id === id);
      if (!block) return;

      // Optimistic update
      startTransition(() => {
        addOptimistic({ type: "remove", id });
      });

      // Update local state
      setEvents((prev) => prev.filter((b) => b.id !== id));

      // Skip persistence for temp blocks
      if (id.startsWith("temp-")) return;

      try {
        await deleteAvailabilityBlock(id);
      } catch (error) {
        // Rollback on error
        setEvents((prev) => [...prev, block]);
        console.error("Failed to delete block:", error);
        throw error;
      }
    },
    [addOptimistic, events]
  );

  const handleSelectSlot = useCallback(
    ({ start, end }: SlotInfo) => {
      addBlock(start, end);
    },
    [addBlock]
  );

  const handleEventDrop = useCallback(
    ({ event, start, end }: TimeBlockInteraction) => {
      updateBlock(event.id, start, end);
    },
    [updateBlock]
  );

  const handleEventResize = useCallback(
    ({ event, start, end }: TimeBlockInteraction) => {
      updateBlock(event.id, start, end);
    },
    [updateBlock]
  );

  // Copy time from source date to target date
  const copyTimeToDate = useCallback(
    (source: Date, target: Date): Date =>
      set(target, {
        hours: source.getHours(),
        minutes: source.getMinutes(),
        seconds: source.getSeconds(),
      }),
    []
  );

  // Copy all blocks from a specific day (by index 0-6) to other days of the week
  const copyDayToWeek = useCallback(
    async (
      dayIndex: number,
      referenceDate: Date,
      includeWeekends = true
    ): Promise<void> => {
      const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
      const sourceDay = addDays(weekStart, dayIndex);
      const dayStart = startOfDay(sourceDay);
      const dayEnd = endOfDay(sourceDay);

      const dayBlocks = events.filter(
        (b) => b.start >= dayStart && b.start <= dayEnd
      );

      if (dayBlocks.length === 0) return;

      const newBlocks: Array<{ tempId: string; start: Date; end: Date }> = [];
      const tempBlocks: TimeBlock[] = [];

      for (let i = 0; i < 7; i++) {
        if (i === dayIndex) continue;
        if (!includeWeekends && (i === 5 || i === 6)) continue;

        const targetDay = addDays(weekStart, i);

        for (const block of dayBlocks) {
          const tempId = `temp-${crypto.randomUUID()}`;
          const start = copyTimeToDate(block.start, targetDay);
          const end = copyTimeToDate(block.end, targetDay);

          newBlocks.push({ tempId, start, end });
          tempBlocks.push({ id: tempId, start, end });
        }
      }

      // Optimistic update
      startTransition(() => {
        addOptimistic({ type: "bulkAdd", blocks: tempBlocks });
      });

      // Update local state
      setEvents((prev) => mergeOverlappingBlocks([...prev, ...tempBlocks]));

      // Persist to Sanity
      try {
        const results = await bulkSaveAvailabilityBlocks(newBlocks);
        // Replace temp IDs with real keys
        setEvents((prev) =>
          prev.map((b) => {
            const result = results.find((r) => r.tempId === b.id);
            return result ? { ...b, id: result.realKey } : b;
          })
        );
      } catch (error) {
        // Rollback on error
        const tempIds = tempBlocks.map((b) => b.id);
        setEvents((prev) => prev.filter((b) => !tempIds.includes(b.id)));
        console.error("Failed to copy blocks:", error);
        throw error;
      }
    },
    [addOptimistic, copyTimeToDate, events]
  );

  // Clear all blocks in the week containing referenceDate
  const clearWeek = useCallback(
    async (referenceDate: Date): Promise<void> => {
      const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
      const weekEnd = addDays(weekStart, 7);

      const blocksToDelete = events.filter(
        (b) => b.start >= weekStart && b.start < weekEnd
      );

      if (blocksToDelete.length === 0) return;

      const idsToDelete = blocksToDelete.map((b) => b.id);

      // Optimistic update
      startTransition(() => {
        addOptimistic({ type: "bulkRemove", ids: idsToDelete });
      });

      // Update local state
      setEvents((prev) =>
        prev.filter((b) => b.start < weekStart || b.start >= weekEnd)
      );

      // Get only real keys (not temp IDs) for deletion
      const realKeysToDelete = idsToDelete.filter(
        (id) => !id.startsWith("temp-")
      );

      if (realKeysToDelete.length === 0) return;

      try {
        await bulkDeleteAvailabilityBlocks(realKeysToDelete);
      } catch (error) {
        // Rollback on error
        setEvents((prev) => [...prev, ...blocksToDelete]);
        console.error("Failed to clear week:", error);
        throw error;
      }
    },
    [addOptimistic, events]
  );

  return {
    events: optimisticEvents,
    isPending,
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
