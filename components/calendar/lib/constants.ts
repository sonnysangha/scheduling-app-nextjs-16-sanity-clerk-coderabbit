export const CALENDAR_CONFIG = {
  step: 15,
  timeslots: 4,
} as const;

// Full 24-hour range: 00:00 to 23:59
export const MIN_TIME = new Date(1970, 0, 1, 0, 0, 0);
export const MAX_TIME = new Date(1970, 0, 1, 23, 59, 59);

// Days of week (Monday = 0, Sunday = 6)
export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
