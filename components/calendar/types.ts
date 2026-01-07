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

// Combined event type for the calendar
export type CalendarEvent = TimeBlock | BusyBlock;

// Type guard to check if event is a busy block
export function isBusyBlock(event: CalendarEvent): event is BusyBlock {
  return "accountEmail" in event;
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
