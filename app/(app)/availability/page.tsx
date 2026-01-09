import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { startOfWeek, addWeeks } from "date-fns";
import { sanityFetch } from "@/sanity/lib/live";
import { USER_WITH_AVAILABILITY_QUERY } from "@/sanity/queries/users";
import { HOST_UPCOMING_BOOKINGS_QUERY } from "@/sanity/queries/bookings";
import {
  getGoogleBusyTimes,
  getBookingAttendeeStatuses,
} from "@/lib/actions/calendar";
import { AvailabilityCalendar } from "@/components/calendar";
import { ShareLinkDialog } from "@/components/calendar/components/share-link-dialog";
import type {
  TimeBlock,
  BusyBlock,
  BookedBlock,
} from "@/components/calendar/types";

export default async function AvailabilityPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  // Fetch availability, bookings, and Google busy times in parallel
  const now = new Date();
  const rangeStart = startOfWeek(now);
  const rangeEnd = addWeeks(rangeStart, 8); // 8 weeks ahead

  const [{ data: user }, { data: bookings }, busyTimes] = await Promise.all([
    sanityFetch({
      query: USER_WITH_AVAILABILITY_QUERY,
      params: { clerkId: userId },
    }),
    sanityFetch({
      query: HOST_UPCOMING_BOOKINGS_QUERY,
      params: { clerkId: userId, startDate: rangeStart.toISOString() },
    }),
    getGoogleBusyTimes(rangeStart, rangeEnd),
  ]);

  const availability = user?.availability ?? [];

  // Fetch attendee statuses for bookings with Google events
  // This also deletes any bookings whose Google Calendar events are cancelled/deleted
  const bookingsList = bookings ?? [];
  const attendeeStatuses = await getBookingAttendeeStatuses(
    bookingsList
      .filter((b) => b.googleEventId)
      .map((b) => ({
        id: b._id,
        googleEventId: b.googleEventId,
        guestEmail: b.guestEmail,
      })),
  );

  // Transform bookings to BookedBlock format with guest status from Google Calendar
  // Filter out cancelled bookings (Google Calendar is source of truth)
  const bookedBlocks: BookedBlock[] = bookingsList
    .filter((booking) => {
      // Keep bookings without Google events or those not cancelled in Google
      const statuses = attendeeStatuses[booking._id];
      return !booking.googleEventId || !statuses?.isCancelled;
    })
    .map((booking) => {
      const statuses = attendeeStatuses[booking._id];
      return {
        id: booking._id,
        start: new Date(booking.startTime),
        end: new Date(booking.endTime),
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        googleEventId: booking.googleEventId ?? undefined,
        meetLink: booking.meetLink ?? undefined,
        attendeeStatus: statuses?.guestStatus,
      };
    });

  // Transform Sanity data to TimeBlock format
  // We show the FULL availability as stored in Sanity (bookings are displayed separately as green blocks)
  const initialBlocks: TimeBlock[] = availability.map((slot) => ({
    id: slot._key,
    start: new Date(slot.startDateTime),
    end: new Date(slot.endDateTime),
  }));

  // Filter out busy times that overlap with our bookings (to avoid duplication)
  const isOverlappingWithBooking = (busyStart: Date, busyEnd: Date) =>
    bookedBlocks.some(
      (booking) => busyStart < booking.end && busyEnd > booking.start,
    );

  // Transform busy times to BusyBlock format (excluding our own bookings)
  const initialBusyBlocks: BusyBlock[] = busyTimes
    .filter(
      (busy) =>
        !isOverlappingWithBooking(new Date(busy.start), new Date(busy.end)),
    )
    .map((busy, index) => ({
      id: `busy-${index}`,
      start: new Date(busy.start),
      end: new Date(busy.end),
      title: "Busy",
      accountEmail: busy.accountEmail,
    }));

  return (
    <main className="container mx-auto px-4 py-8 max-sm:py-4">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Set Your Availability</h1>
          <p className="mt-1 text-muted-foreground">
            Drag to create time blocks. Click a block to remove it. Changes save
            automatically.
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {bookedBlocks.length > 0 && (
              <>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 bg-green-600 rounded" />
                  Accepted
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 bg-amber-500 rounded" />
                  Tentative
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 bg-red-500 rounded" />
                  Declined
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 bg-gray-500 rounded" />
                  Pending
                </span>
              </>
            )}
            {initialBusyBlocks.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-red-200 border border-red-400 rounded" />
                Busy (external)
              </span>
            )}
          </div>
        </div>
        <ShareLinkDialog />
      </div>
      <AvailabilityCalendar
        initialBlocks={initialBlocks}
        busyBlocks={initialBusyBlocks}
        bookedBlocks={bookedBlocks}
      />
    </main>
  );
}
