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

// Attendee response status from Google Calendar
export type AttendeeStatus =
  | "accepted"
  | "declined"
  | "tentative"
  | "needsAction"
  | "unknown";

// A booked meeting block (read-only, from Sanity bookings)
export interface BookedBlock {
  id: string;
  start: Date;
  end: Date;
  guestName: string;
  guestEmail: string;
  googleEventId?: string;
  /** Guest's response status */
  attendeeStatus?: AttendeeStatus;
  /** Host's response status (for when host declines their own meeting) */
  hostStatus?: AttendeeStatus;
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
