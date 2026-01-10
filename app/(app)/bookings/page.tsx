import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sanityFetch } from "@/sanity/lib/live";
import { HOST_BOOKINGS_BY_CLERK_ID_QUERY } from "@/sanity/queries/bookings";
import { getBookingAttendeeStatuses } from "@/lib/actions/calendar";
import { BookingsList } from "@/components/bookings/bookings-list";
import { RefreshButton } from "@/components/ui/refresh-button";

export default async function BookingsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const { data: bookings } = await sanityFetch({
    query: HOST_BOOKINGS_BY_CLERK_ID_QUERY,
    params: { clerkId: userId },
  });

  const bookingsList = bookings ?? [];

  // Fetch attendee statuses for bookings with Google events
  // This also deletes any bookings whose Google Calendar events are cancelled/deleted
  const attendeeStatuses = await getBookingAttendeeStatuses(
    bookingsList
      .filter((b) => b.googleEventId)
      .map((b) => ({
        id: b._id,
        googleEventId: b.googleEventId,
        guestEmail: b.guestEmail,
      })),
  );

  // Add statuses to bookings, filtering out cancelled ones
  const bookingsWithStatuses = bookingsList
    .filter((booking) => {
      // Keep bookings without Google events or those that are not cancelled
      const statuses = attendeeStatuses[booking._id];
      return !booking.googleEventId || !statuses?.isCancelled;
    })
    .map((booking) => {
      const statuses = attendeeStatuses[booking._id];
      return {
        ...booking,
        guestStatus: statuses?.guestStatus,
      };
    });

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Bookings</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage your upcoming meetings.
          </p>
        </div>
        <RefreshButton />
      </div>

      <BookingsList bookings={bookingsWithStatuses} />
    </main>
  );
}
