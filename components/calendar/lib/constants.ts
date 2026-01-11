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

// ============================================================================
// Calendar Event Colors
// ============================================================================

/** Colors for availability time blocks */
export const AVAILABILITY_COLORS = {
  background: "#f3f4f6", // gray-100
  border: "#d1d5db", // gray-300
  backgroundHover: "#f9fafb", // gray-50
} as const;

/** Colors for busy blocks (external calendar events) */
export const BUSY_BLOCK_COLORS = {
  background: "#fecaca", // red-200
  border: "#f87171", // red-400
  text: "#991b1b", // red-800
} as const;

/** Colors for booked meeting blocks based on attendee status */
export const BOOKING_STATUS_COLORS = {
  declined: {
    background: "#ef4444", // red-500
    border: "#dc2626", // red-600
    text: "#ffffff",
  },
  tentative: {
    background: "#f59e0b", // amber-500
    border: "#d97706", // amber-600
    text: "#ffffff",
  },
  accepted: {
    background: "#16a34a", // green-600
    border: "#15803d", // green-700
    text: "#ffffff",
  },
  default: {
    background: "#6b7280", // gray-500
    border: "#4b5563", // gray-600
    text: "#ffffff",
  },
} as const;
