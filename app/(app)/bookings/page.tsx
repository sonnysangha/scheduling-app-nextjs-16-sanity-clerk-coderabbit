import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { sanityFetch } from "@/sanity/lib/live";
import { HOST_BOOKINGS_BY_CLERK_ID_QUERY } from "@/sanity/queries/bookings";
import { getBookingAttendeeStatuses } from "@/lib/actions/calendar";
import { BookingsList } from "@/components/bookings/bookings-list";

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
  const attendeeStatuses = await getBookingAttendeeStatuses(
    bookingsList
      .filter((b) => b.googleEventId)
      .map((b) => ({
        id: b._id,
        googleEventId: b.googleEventId,
        guestEmail: b.guestEmail,
      })),
  );

  // Add statuses to bookings
  const bookingsWithStatuses = bookingsList.map((booking) => {
    const statuses = attendeeStatuses[booking._id];
    return {
      ...booking,
      guestStatus: statuses?.guestStatus,
      hostStatus: statuses?.hostStatus,
    };
  });

  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Your Bookings</h1>
        <p className="mt-1 text-muted-foreground">
          View and manage your upcoming meetings.
        </p>
      </div>

      <BookingsList bookings={bookingsWithStatuses} />
    </main>
  );
}
