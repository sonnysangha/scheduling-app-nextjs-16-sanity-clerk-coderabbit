import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAvailability } from "@/lib/actions/availability";
import { AvailabilityCalendar } from "@/components/calendar";
import type { TimeBlock } from "@/components/calendar/types";

export default async function AvailabilityPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const availability = await getAvailability();

  // Transform Sanity data to TimeBlock format
  const initialBlocks: TimeBlock[] = availability.map((slot) => ({
    id: slot._key,
    start: new Date(slot.startDateTime),
    end: new Date(slot.endDateTime),
  }));

  return (
    <main className="container mx-auto px-4 py-8 max-sm:py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Set Your Availability</h1>
        <p className="mt-1 text-muted-foreground">
          Drag to create time blocks. Click a block to remove it. Changes save
          automatically.
        </p>
      </div>
      <AvailabilityCalendar initialBlocks={initialBlocks} />
    </main>
  );
}
