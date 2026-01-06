import { AvailabilityCalendar } from "@/components/calendar/availability-calendar";

export default function AvailabilityPage() {
  return (
    <main className="container mx-auto px-4 py-8 max-sm:py-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Set Your Availability</h1>
        <p className="mt-1 text-muted-foreground">
          Drag to create time blocks. Click a block to remove it.
        </p>
      </div>
      <AvailabilityCalendar />
    </main>
  );
}
