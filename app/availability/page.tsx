import { AvailabilityCalendar } from "@/components/calendar/availability-calendar";

export default function AvailabilityPage() {
  return (
    <main className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Set Your Availability</h1>
        <p className="text-muted-foreground mt-1">
          Drag to create time blocks. Click a block to remove it.
        </p>
      </div>
      <AvailabilityCalendar />
    </main>
  );
}
