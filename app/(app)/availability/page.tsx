import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { startOfWeek, endOfWeek, addWeeks } from "date-fns";
import { sanityFetch } from "@/sanity/lib/live";
import { USER_WITH_AVAILABILITY_QUERY } from "@/sanity/queries/users";
import { getGoogleBusyTimes } from "@/lib/actions/calendar";
import { AvailabilityCalendar } from "@/components/calendar";
import type { TimeBlock, BusyBlock } from "@/components/calendar/types";

export default async function AvailabilityPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  // Fetch availability blocks and Google busy times in parallel
  const now = new Date();
  const rangeStart = startOfWeek(now);
  const rangeEnd = endOfWeek(addWeeks(now, 4)); // 4 weeks ahead

  const [{ data: user }, busyTimes] = await Promise.all([
    sanityFetch({
      query: USER_WITH_AVAILABILITY_QUERY,
      params: { clerkId: userId },
    }),
    getGoogleBusyTimes(rangeStart, rangeEnd),
  ]);

  const availability = user?.availability ?? [];

  // Transform Sanity data to TimeBlock format
  const initialBlocks: TimeBlock[] = availability.map((slot) => ({
    id: slot._key,
    start: new Date(slot.startDateTime),
    end: new Date(slot.endDateTime),
  }));

  // Transform busy times to BusyBlock format
  const initialBusyBlocks: BusyBlock[] = busyTimes.map((busy, index) => ({
    id: `busy-${index}`,
    start: new Date(busy.start),
    end: new Date(busy.end),
    title: "Busy",
    accountEmail: busy.accountEmail,
  }));

  return (
    <main className="container mx-auto px-4 py-8 max-sm:py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Set Your Availability</h1>
        <p className="mt-1 text-muted-foreground">
          Drag to create time blocks. Click a block to remove it. Changes save
          automatically.
        </p>
        {initialBusyBlocks.length > 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="inline-block w-3 h-3 bg-red-200 rounded mr-1" />
            Red blocks show busy times from your connected Google Calendars.
          </p>
        )}
      </div>
      <AvailabilityCalendar
        initialBlocks={initialBlocks}
        busyBlocks={initialBusyBlocks}
      />
    </main>
  );
}
