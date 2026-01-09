import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { sanityFetch } from "@/sanity/lib/live";
import { MEETING_TYPE_BY_SLUGS_QUERY } from "@/sanity/queries/meetingTypes";
import { ALL_BOOKINGS_BY_HOST_SLUG_QUERY } from "@/sanity/queries/bookings";
import { BookingCalendar } from "@/components/booking/booking-calendar";
import {
  computeAvailableDates,
  computeAvailableSlots,
} from "@/lib/availability";
import { getActivebookingIds } from "@/lib/actions/calendar";
import { Clock } from "lucide-react";
import { startOfDay, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

interface BookingPageProps {
  params: Promise<{ slug: string; meetingType: string }>;
}

export default async function MeetingTypeBookingPage({
  params,
}: BookingPageProps) {
  const { slug, meetingType } = await params;

  // ============================================================================
  // TIMEZONE-AWARE DATE GROUPING
  // ============================================================================
  // Read the visitor's timezone from cookie (set by TimezoneDetector component).
  // If no cookie exists (first visit before JS runs), fall back to UTC.
  // The page will re-render correctly after the cookie is set.
  // ============================================================================
  const cookieStore = await cookies();
  let visitorTimezone = cookieStore.get("timezone")?.value ?? "UTC";

  // Validate timezone is a real IANA timezone (prevents crash from tampered cookie)
  try {
    Intl.DateTimeFormat(undefined, { timeZone: visitorTimezone });
  } catch {
    visitorTimezone = "UTC";
  }

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
  const allBookingsRaw = bookings ?? [];

  // ============================================================================
  // GOOGLE CALENDAR SYNC - Filter out cancelled bookings
  // ============================================================================
  // Google Calendar is the source of truth. Check each booking's status
  // and only include active (not cancelled) bookings in availability calculation.
  // ============================================================================
  const hostAccount = host.connectedAccounts?.find((a) => a.isDefault) ?? null;
  const activeBookingIds = await getActivebookingIds(
    hostAccount
      ? {
          _key: hostAccount._key,
          email: hostAccount.email,
          accessToken: hostAccount.accessToken,
          refreshToken: hostAccount.refreshToken,
          expiryDate: null, // Not available in this query
        }
      : null,
    allBookingsRaw.map((b) => ({ id: b._id, googleEventId: b.googleEventId })),
  );

  // Only include active bookings (not cancelled in Google Calendar)
  const allBookings = allBookingsRaw.filter((b) => activeBookingIds.has(b._id));

  // ============================================================================
  // SERVER-SIDE SLOT COMPUTATION
  // ============================================================================
  // Slots are computed server-side and grouped by date using the VISITOR'S
  // timezone (from cookie). This ensures correct calendar day display.
  // ============================================================================

  const today = startOfDay(new Date());

  // Find the latest availability block end date
  const latestEndDate = availability.reduce<Date>((latest, slot) => {
    const slotEnd = parseISO(slot.endDateTime);
    return slotEnd > latest ? slotEnd : latest;
  }, today);

  // Compute available dates (for iteration only)
  const serverDates = computeAvailableDates(
    availability,
    allBookings,
    today,
    latestEndDate,
    duration,
  );

  // Compute all slots and group by date in VISITOR'S TIMEZONE
  const slotsByDate: Record<string, Array<{ start: string; end: string }>> = {};

  for (const dateStr of serverDates) {
    const date = new Date(dateStr);
    const slots = computeAvailableSlots(
      availability,
      allBookings,
      date,
      duration,
    );

    // Group each slot by its date in the VISITOR'S timezone
    for (const slot of slots) {
      // Format date key using visitor's timezone (e.g., "2024-01-15")
      const localDateKey = formatInTimeZone(
        slot.start,
        visitorTimezone,
        "yyyy-MM-dd",
      );

      if (!slotsByDate[localDateKey]) {
        slotsByDate[localDateKey] = [];
      }

      slotsByDate[localDateKey].push({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
      });
    }
  }

  // Get unique available dates (now correctly in visitor's timezone)
  const availableDates = Object.keys(slotsByDate).sort();

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

        {/* Booking Calendar - receives slots pre-grouped by visitor's timezone */}
        <BookingCalendar
          hostSlug={slug}
          hostName={host.name ?? "Host"}
          meetingTypeSlug={meetingType}
          meetingTypeName={meetingTypeData.name ?? "Meeting"}
          duration={duration}
          availableDates={availableDates}
          slotsByDate={slotsByDate}
          timezone={visitorTimezone}
        />
      </div>
    </main>
  );
}
