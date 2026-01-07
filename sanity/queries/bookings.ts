/**
 * Booking-related GROQ Queries
 *
 * All queries use `defineQuery` from `next-sanity` for TypeGen support.
 * Run `pnpm run typegen` after modifying queries to regenerate types.
 */

import { defineQuery } from "next-sanity";

/**
 * Get all bookings for a host
 */
export const BOOKINGS_BY_HOST_QUERY = defineQuery(`*[
  _type == "booking"
  && host._ref == $hostId
  && status == "confirmed"
] | order(startTime asc) {
  _id,
  _type,
  guestName,
  guestEmail,
  startTime,
  endTime,
  status,
  notes,
  googleEventId
}`);

/**
 * Get bookings for a host within a date range
 */
export const BOOKINGS_IN_RANGE_QUERY = defineQuery(`*[
  _type == "booking"
  && host._ref == $hostId
  && status == "confirmed"
  && startTime >= $startDate
  && startTime <= $endDate
] | order(startTime asc) {
  _id,
  startTime,
  endTime
}`);

/**
 * Get a single booking by ID
 */
export const BOOKING_BY_ID_QUERY = defineQuery(`*[
  _type == "booking"
  && _id == $bookingId
][0]{
  _id,
  _type,
  host->{
    _id,
    name,
    email
  },
  guestName,
  guestEmail,
  startTime,
  endTime,
  status,
  notes,
  googleEventId
}`);

/**
 * Get booking with host's default calendar account (for cancellation)
 */
export const BOOKING_WITH_HOST_CALENDAR_QUERY = defineQuery(`*[
  _type == "booking"
  && _id == $bookingId
][0]{
  _id,
  googleEventId,
  host->{
    _id,
    connectedAccounts[isDefault == true][0]{
      _key,
      accountId,
      email,
      accessToken,
      refreshToken,
      expiryDate,
      isDefault
    }
  }
}`);
