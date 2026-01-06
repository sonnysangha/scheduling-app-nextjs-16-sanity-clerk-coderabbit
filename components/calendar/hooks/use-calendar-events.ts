"use client";

import { useState } from "react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  addDays,
  setHours,
  setMinutes,
  setSeconds,
  getHours,
  getMinutes,
  getSeconds,
  isSameDay,
} from "date-fns";
import type { CalendarEvent, EventInteraction, SlotInfo } from "../types";
import { CALENDAR_CONFIG } from "../lib/constants";

export function useCalendarEvents(initialEvents: CalendarEvent[] = []) {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);

  const addEvent = (start: Date, end: Date) => {
    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      title: CALENDAR_CONFIG.defaultTitle,
      start,
      end,
    };
    setEvents((prev) => [...prev, newEvent]);
    return newEvent;
  };

  const updateEvent = (id: string, start: Date, end: Date) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, start, end } : e))
    );
  };

  const removeEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSelectSlot = ({ start, end }: SlotInfo) => addEvent(start, end);

  const handleEventDrop = ({ event, start, end }: EventInteraction) =>
    updateEvent(event.id, start, end);

  const handleEventResize = ({ event, start, end }: EventInteraction) =>
    updateEvent(event.id, start, end);

  // Copy time from source event to target date
  const copyTimeToDate = (sourceDate: Date, targetDate: Date): Date => {
    let result = setHours(targetDate, getHours(sourceDate));
    result = setMinutes(result, getMinutes(sourceDate));
    result = setSeconds(result, getSeconds(sourceDate));
    return result;
  };

  // Copy all events from a specific day (by index 0-6) to other days of the week
  const copyDayToWeek = (
    dayIndex: number,
    referenceDate: Date,
    includeWeekends = true
  ) => {
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
    const sourceDay = addDays(weekStart, dayIndex);
    const dayStart = startOfDay(sourceDay);
    const dayEnd = endOfDay(sourceDay);

    // Get events for the source day
    const dayEvents = events.filter(
      (e) => e.start >= dayStart && e.start <= dayEnd
    );

    if (dayEvents.length === 0) return;

    // Create copies for each day of the week (except source day)
    const newEvents: CalendarEvent[] = [];

    for (let i = 0; i < 7; i++) {
      if (i === dayIndex) continue; // Skip the source day
      if (!includeWeekends && (i === 5 || i === 6)) continue; // Skip Sat/Sun

      const targetDay = addDays(weekStart, i);

      // Copy each event to this day
      for (const event of dayEvents) {
        newEvents.push({
          id: crypto.randomUUID(),
          title: event.title,
          start: copyTimeToDate(event.start, targetDay),
          end: copyTimeToDate(event.end, targetDay),
        });
      }
    }

    setEvents((prev) => [...prev, ...newEvents]);
  };

  // Clear all events in the week containing referenceDate
  const clearWeek = (referenceDate: Date) => {
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 7);

    setEvents((prev) =>
      prev.filter((e) => e.start < weekStart || e.start >= weekEnd)
    );
  };

  return {
    events,
    addEvent,
    updateEvent,
    removeEvent,
    handleSelectSlot,
    handleEventDrop,
    handleEventResize,
    copyDayToWeek,
    clearWeek,
  };
}
