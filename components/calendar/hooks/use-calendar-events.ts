"use client";

import { useState, useOptimistic, useTransition } from "react";
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

// Find blocks that overlap with a given block
const findOverlappingBlocks = (
  block: TimeBlock,
  blocks: TimeBlock[]
): TimeBlock[] =>
  blocks.filter((b) => b.id !== block.id && blocksOverlapOrTouch(b, block));

// Calculate the merged result of a block with all overlapping blocks
const calculateMergedBlock = (
  block: TimeBlock,
  overlapping: TimeBlock[]
): TimeBlock => {
  let start = block.start;
  let end = block.end;

  for (const overlap of overlapping) {
    start = new Date(Math.min(start.getTime(), overlap.start.getTime()));
    end = new Date(Math.max(end.getTime(), overlap.end.getTime()));
  }

  return { id: block.id, start, end };
};

// Copy time from source date to target date
const copyTimeToDate = (source: Date, target: Date): Date =>
  set(target, {
    hours: source.getHours(),
    minutes: source.getMinutes(),
    seconds: source.getSeconds(),
  });

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

  const addBlock = async (start: Date, end: Date): Promise<TimeBlock> => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const block: TimeBlock = { id: tempId, start, end };

    // Find blocks that will be consumed by this new block
    const overlapping = findOverlappingBlocks(block, events);
    const blocksToDelete = overlapping.filter((b) => !b.id.startsWith("temp-"));

    // Calculate the merged result
    const mergedBlock =
      overlapping.length > 0 ? calculateMergedBlock(block, overlapping) : block;

    // Optimistic update - instant UI feedback
    startTransition(() => {
      addOptimistic({ type: "add", block: mergedBlock });
    });

    // Update local state with merged result
    setEvents((prev) => mergeOverlappingBlocks([...prev, block]));

    // Persist to Sanity
    try {
      // First, delete any blocks that will be merged
      if (blocksToDelete.length > 0) {
        const idsToDelete = blocksToDelete.map((b) => b.id);
        await bulkDeleteAvailabilityBlocks(idsToDelete);
      }

      // Save the merged block
      const { realKey } = await saveAvailabilityBlock({
        tempId,
        start: mergedBlock.start,
        end: mergedBlock.end,
      });

      // Replace temp ID with real key
      setEvents((prev) =>
        prev.map((b) => (b.id === tempId ? { ...b, id: realKey } : b))
      );
      return { ...mergedBlock, id: realKey };
    } catch (error) {
      // Rollback on error
      setEvents((prev) => {
        const withoutNew = prev.filter((b) => b.id !== tempId);
        return [...withoutNew, ...blocksToDelete];
      });
      console.error("Failed to save block:", error);
      throw error;
    }
  };

  const updateBlock = async (
    id: string,
    start: Date,
    end: Date
  ): Promise<void> => {
    const updatedBlock: TimeBlock = { id, start, end };

    // Find blocks that will be consumed by this updated block
    const overlapping = findOverlappingBlocks(updatedBlock, events);
    const blocksToDelete = overlapping.filter((b) => !b.id.startsWith("temp-"));

    // Calculate the merged result
    const mergedBlock =
      overlapping.length > 0
        ? calculateMergedBlock(updatedBlock, overlapping)
        : updatedBlock;

    // Optimistic update
    startTransition(() => {
      addOptimistic({ type: "update", block: mergedBlock });
    });

    // Store previous state for rollback
    const previousEvents = [...events];

    // Update local state with merged result
    setEvents((prev) =>
      mergeOverlappingBlocks(
        prev.map((b) => (b.id === id ? { ...b, start, end } : b))
      )
    );

    // Skip persistence for temp blocks (haven't been saved yet)
    if (id.startsWith("temp-")) return;

    try {
      // First, delete any blocks that will be merged
      if (blocksToDelete.length > 0) {
        const idsToDelete = blocksToDelete.map((b) => b.id);
        await bulkDeleteAvailabilityBlocks(idsToDelete);
      }

      // Update the block with merged times
      await updateAvailabilityBlock({
        key: id,
        start: mergedBlock.start,
        end: mergedBlock.end,
      });
    } catch (error) {
      // Rollback on error
      setEvents(previousEvents);
      console.error("Failed to update block:", error);
      throw error;
    }
  };

  const removeBlock = async (id: string): Promise<void> => {
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

  const copyDayToWeek = async (
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
    const allOverlapping: TimeBlock[] = [];

    for (let i = 0; i < 7; i++) {
      if (i === dayIndex) continue;
      if (!includeWeekends && (i === 5 || i === 6)) continue;

      const targetDay = addDays(weekStart, i);

      for (const block of dayBlocks) {
        const tempId = `temp-${crypto.randomUUID()}`;
        const start = copyTimeToDate(block.start, targetDay);
        const end = copyTimeToDate(block.end, targetDay);

        const tempBlock: TimeBlock = { id: tempId, start, end };

        // Find any overlapping blocks on the target day
        const overlapping = findOverlappingBlocks(tempBlock, events);
        allOverlapping.push(...overlapping);

        // Calculate merged block
        const merged =
          overlapping.length > 0
            ? calculateMergedBlock(tempBlock, overlapping)
            : tempBlock;

        newBlocks.push({ tempId, start: merged.start, end: merged.end });
        tempBlocks.push({ id: tempId, start: merged.start, end: merged.end });
      }
    }

    // Get unique blocks to delete (dedupe by id)
    const blocksToDelete = allOverlapping
      .filter((b) => !b.id.startsWith("temp-"))
      .filter((b, i, arr) => arr.findIndex((x) => x.id === b.id) === i);

    // Optimistic update
    startTransition(() => {
      if (blocksToDelete.length > 0) {
        addOptimistic({
          type: "bulkRemove",
          ids: blocksToDelete.map((b) => b.id),
        });
      }
      addOptimistic({ type: "bulkAdd", blocks: tempBlocks });
    });

    // Store previous state for rollback
    const previousEvents = [...events];

    // Update local state
    setEvents((prev) => mergeOverlappingBlocks([...prev, ...tempBlocks]));

    // Persist to Sanity
    try {
      // First, delete overlapping blocks
      if (blocksToDelete.length > 0) {
        await bulkDeleteAvailabilityBlocks(blocksToDelete.map((b) => b.id));
      }

      // Save the new blocks
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
      setEvents(previousEvents);
      console.error("Failed to copy blocks:", error);
      throw error;
    }
  };

  const clearWeek = async (referenceDate: Date): Promise<void> => {
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
  };

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
