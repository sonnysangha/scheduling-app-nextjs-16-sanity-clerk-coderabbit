export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

export interface SlotInfo {
  start: Date;
  end: Date;
  action: "select" | "click" | "doubleClick";
}

export interface EventInteraction {
  event: CalendarEvent;
  start: Date;
  end: Date;
}
