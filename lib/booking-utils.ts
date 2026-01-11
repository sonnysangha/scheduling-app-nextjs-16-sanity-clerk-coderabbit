/**
 * Shared booking utility functions
 *
 * Common logic for processing bookings with Google Calendar statuses.
 * Uses Sanity-derived types where possible for type safety.
 */

import {
  getBookingAttendeeStatuses,
  type BookingStatuses,
} from "@/lib/actions/calendar";
import type { AttendeeStatus } from "@/lib/google-calendar";
import type {
  HostBooking,
  HostUpcomingBooking,
} from "@/sanity/queries/bookings";

// ============================================================================
// Types
// ============================================================================

/**
 * Minimal interface for any booking that has Google Calendar event data.
 * Compatible with both HostBooking and HostUpcomingBooking from Sanity.
 */
export type BookingWithGoogleEvent = Pick<
  HostBooking | HostUpcomingBooking,
  "_id" | "googleEventId" | "guestEmail"
>;

export type ProcessedBooking<T extends BookingWithGoogleEvent> = T & {
  guestStatus?: AttendeeStatus;
};

// ============================================================================
// Shared Processing Functions
// ============================================================================

/**
 * Fetch attendee statuses and filter out cancelled bookings.
 * This is the common logic used by both availability and bookings pages.
 *
 * @param bookings - Raw bookings from Sanity
 * @returns Tuple of [attendeeStatuses record, filtered active bookings with statuses]
 */
export async function processBookingsWithStatuses<
  T extends BookingWithGoogleEvent
>(
  bookings: T[]
): Promise<{
  statuses: Record<string, BookingStatuses>;
  activeBookings: ProcessedBooking<T>[];
}> {
  // Fetch attendee statuses for bookings with Google events
  // This also deletes any bookings whose Google Calendar events are cancelled/deleted
  const statuses = await getBookingAttendeeStatuses(
    bookings
      .filter((b) => b.googleEventId)
      .map((b) => ({
        id: b._id,
        googleEventId: b.googleEventId,
        guestEmail: b.guestEmail,
      }))
  );

  // Filter out cancelled bookings and add status to each
  const activeBookings = bookings
    .filter((booking) => {
      // Keep bookings without Google events or those that are not cancelled
      const bookingStatus = statuses[booking._id];
      return !booking.googleEventId || !bookingStatus?.isCancelled;
    })
    .map((booking) => {
      const bookingStatus = statuses[booking._id];
      return {
        ...booking,
        guestStatus: bookingStatus?.guestStatus,
      };
    });

  return { statuses, activeBookings };
}
