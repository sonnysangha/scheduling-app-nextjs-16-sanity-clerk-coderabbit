import { notFound } from "next/navigation";
import { sanityFetch } from "@/sanity/lib/live";
import { MEETING_TYPE_BY_SLUGS_QUERY } from "@/sanity/queries/meetingTypes";
import { ALL_BOOKINGS_BY_HOST_SLUG_QUERY } from "@/sanity/queries/bookings";
import { BookingCalendar } from "@/components/booking/booking-calendar";
import {
  computeAvailableDates,
  computeAvailableSlots,
} from "@/lib/availability";
import { Clock } from "lucide-react";
import { startOfDay, parseISO } from "date-fns";

interface BookingPageProps {
  params: Promise<{ slug: string; meetingType: string }>;
}

export default async function MeetingTypeBookingPage({
  params,
}: BookingPageProps) {
  const { slug, meetingType } = await params;

  // Fetch ALL data via sanityFetch for real-time updates
  const [{ data: meetingTypeData }, { data: bookings }] = await Promise.all([
    sanityFetch({
      query: MEETING_TYPE_BY_SLUGS_QUERY,
      params: { hostSlug: slug, meetingTypeSlug: meetingType },
    }),
    sanityFetch({
      query: ALL_BOOKINGS_BY_HOST_SLUG_QUERY,
      params: { hostSlug: slug },
    }),
  ]);

  if (!meetingTypeData || !meetingTypeData.host) {
    notFound();
  }

  const host = meetingTypeData.host;
  const duration = meetingTypeData.duration ?? 30;
  const availability = host.availability ?? [];
  const allBookings = bookings ?? [];

  // ============================================================================
  // ALL COMPUTATION AT SERVER LEVEL
  // ============================================================================

  const today = startOfDay(new Date());

  // Find the latest availability block end date (no hardcoded range)
  const latestEndDate = availability.reduce<Date>((latest, slot) => {
    const slotEnd = parseISO(slot.endDateTime);
    return slotEnd > latest ? slotEnd : latest;
  }, today);

  // Compute available dates from today to the latest availability block
  const availableDates = computeAvailableDates(
    availability,
    allBookings,
    today,
    latestEndDate,
    duration,
  );

  // Pre-compute available slots for EVERY available date
  const slotsByDate: Record<string, Array<{ start: string; end: string }>> = {};

  for (const dateStr of availableDates) {
    const date = new Date(dateStr);
    const slots = computeAvailableSlots(
      availability,
      allBookings,
      date,
      duration,
    );
    // Serialize dates for client
    slotsByDate[dateStr] = slots.map((s) => ({
      start: s.start.toISOString(),
      end: s.end.toISOString(),
    }));
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Host Info Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-purple-600 text-2xl font-bold text-white mb-4">
            {host.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {meetingTypeData.name}
          </h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            with {host.name}
          </p>

          {/* Duration badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300">
            <Clock className="h-3.5 w-3.5" />
            {meetingTypeData.duration} minutes
          </div>

          {/* Description */}
          {meetingTypeData.description && (
            <p className="mt-4 text-slate-600 dark:text-slate-400 max-w-lg mx-auto">
              {meetingTypeData.description}
            </p>
          )}
        </div>

        {/* Booking Calendar - receives PRE-COMPUTED data, no client computation */}
        <BookingCalendar
          hostSlug={slug}
          hostName={host.name ?? "Host"}
          meetingTypeSlug={meetingType}
          meetingTypeName={meetingTypeData.name ?? "Meeting"}
          duration={duration}
          availableDates={availableDates}
          slotsByDate={slotsByDate}
        />
      </div>
    </main>
  );
}
