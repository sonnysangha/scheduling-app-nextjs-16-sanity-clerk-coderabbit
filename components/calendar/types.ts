// A time block representing availability
export interface TimeBlock {
  id: string;
  start: Date;
  end: Date;
}

// A busy block from Google Calendar (read-only)
export interface BusyBlock {
  id: string;
  start: Date;
  end: Date;
  title: string;
  accountEmail: string;
}

// Re-export AttendeeStatus from google-calendar to avoid duplication
import type { AttendeeStatus } from "@/lib/google-calendar";
export type { AttendeeStatus };

// A booked meeting block (read-only, from Sanity bookings)
export interface BookedBlock {
  id: string;
  start: Date;
  end: Date;
  guestName: string;
  guestEmail: string;
  googleEventId?: string;
  /** Google Meet video conferencing link */
  meetLink?: string;
  /** Guest's response status from Google Calendar */
  attendeeStatus?: AttendeeStatus;
}

// Combined event type for the calendar
export type CalendarEvent = TimeBlock | BusyBlock | BookedBlock;

// Type guard to check if event is a busy block
export function isBusyBlock(event: CalendarEvent): event is BusyBlock {
  return "accountEmail" in event;
}

// Type guard to check if event is a booked block
export function isBookedBlock(event: CalendarEvent): event is BookedBlock {
  return "guestName" in event;
}

// Slot selection from calendar
export interface SlotInfo {
  start: Date;
  end: Date;
}

// Drag/resize interaction
export interface TimeBlockInteraction {
  event: TimeBlock;
  start: Date;
  end: Date;
}
