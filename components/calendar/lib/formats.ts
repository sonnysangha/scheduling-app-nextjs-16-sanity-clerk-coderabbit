import { format } from "date-fns";

// Reusable time range formatter
export const formatTimeRange = (start: Date, end: Date): string =>
  `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`;

// Calendar display formats (24-hour)
export const calendarFormats = {
  timeGutterFormat: (date: Date) => format(date, "HH:mm"),
  eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    formatTimeRange(start, end),
  selectRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    formatTimeRange(start, end),
};

// Calendar UI messages
export const calendarMessages = {
  showMore: (count: number) => `+${count} more`,
};
