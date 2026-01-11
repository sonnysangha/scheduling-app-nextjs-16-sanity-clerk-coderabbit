import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { sanityFetch } from "@/sanity/lib/live";
import { MEETING_TYPE_BY_SLUGS_QUERY } from "@/sanity/queries/meetingTypes";
import { ALL_BOOKINGS_BY_HOST_SLUG_QUERY } from "@/sanity/queries/bookings";
import { BookingCalendar } from "@/components/booking/booking-calendar";
import { QuotaExceeded } from "@/components/booking/quota-exceeded";
import {
  computeAvailableDates,
  computeAvailableSlots,
} from "@/lib/availability";
import { getActivebookingIds } from "@/lib/actions/calendar";
import { getGoogleBusyTimes } from "@/lib/actions/booking";
import { getHostBookingQuotaStatus } from "@/lib/features";
import { HostHeader } from "@/components/booking/host-header";
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
  // BOOKING QUOTA CHECK
  // ============================================================================
  // Check if the host has exceeded their monthly booking limit.
  // If so, show a friendly message instead of the booking calendar.
  // ============================================================================
  const quotaStatus = await getHostBookingQuotaStatus(slug);

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

  // If host has exceeded their monthly booking quota, show the quota exceeded page
  if (quotaStatus.isExceeded) {
    return <QuotaExceeded hostName={host.name ?? "This host"} />;
  }

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
          expiryDate: hostAccount.expiryDate,
        }
      : null,
    allBookingsRaw.map((b) => ({
      id: b._id,
      googleEventId: b.googleEventId,
      guestEmail: b.guestEmail,
    })),
  );

  // Only include active bookings (not cancelled in Google Calendar)
  const allBookings = allBookingsRaw.filter((b) => activeBookingIds.has(b._id));

  // ============================================================================
  // FETCH GOOGLE CALENDAR BUSY TIMES
  // ============================================================================
  // Block time slots that overlap with existing Google Calendar events.
  // This prevents double-booking when the host has other meetings.
  // ============================================================================
  const today = startOfDay(new Date());

  // Find the latest availability block end date
  const latestEndDate = availability.reduce<Date>((latest, slot) => {
    const slotEnd = parseISO(slot.endDateTime);
    return slotEnd > latest ? slotEnd : latest;
  }, today);

  // Fetch busy times from all connected Google Calendar accounts
  const busyTimes = await getGoogleBusyTimes(
    host.connectedAccounts,
    today,
    latestEndDate,
  );

  // ============================================================================
  // SERVER-SIDE SLOT COMPUTATION
  // ============================================================================
  // Slots are computed server-side and grouped by date using the VISITOR'S
  // timezone (from cookie). This ensures correct calendar day display.
  // ============================================================================

  // Compute available dates (for iteration only)
  const serverDates = computeAvailableDates(
    availability,
    allBookings,
    today,
    latestEndDate,
    duration,
    busyTimes,
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
      busyTimes,
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
        <HostHeader
          hostName={host.name}
          meetingType={{
            name: meetingTypeData.name,
            duration: meetingTypeData.duration ?? 30,
            description: meetingTypeData.description,
          }}
        />

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
