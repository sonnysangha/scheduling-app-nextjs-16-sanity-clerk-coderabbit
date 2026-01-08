/**
 * Booking-related GROQ Queries
 *
 * All queries use `defineQuery` from `next-sanity` for TypeGen support.
 * Run `pnpm run typegen` after modifying queries to regenerate types.
 */

import { defineQuery } from "next-sanity";
import type { HOST_BOOKINGS_BY_CLERK_ID_QUERYResult } from "@/sanity/types";

// Derived type for a single booking (for dashboard)
export type HostBooking =
  NonNullable<HOST_BOOKINGS_BY_CLERK_ID_QUERYResult>[number];

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
  endTime,
  googleEventId,
  guestEmail
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

/**
 * Get all bookings for a host by their Clerk ID (for dashboard)
 */
export const HOST_BOOKINGS_BY_CLERK_ID_QUERY = defineQuery(`*[
  _type == "booking"
  && host->clerkId == $clerkId
] | order(startTime desc) {
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
 * Get upcoming confirmed bookings for a host by Clerk ID (for calendar display)
 */
export const HOST_UPCOMING_BOOKINGS_QUERY = defineQuery(`*[
  _type == "booking"
  && host->clerkId == $clerkId
  && status == "confirmed"
  && startTime >= $startDate
] | order(startTime asc) {
  _id,
  guestName,
  guestEmail,
  startTime,
  endTime,
  googleEventId
}`);

/**
 * Get bookings for a host within a date range by host slug (for public booking page)
 */
export const BOOKINGS_BY_HOST_SLUG_IN_RANGE_QUERY = defineQuery(`*[
  _type == "booking"
  && host->slug.current == $hostSlug
  && status == "confirmed"
  && startTime >= $startDate
  && startTime <= $endDate
] | order(startTime asc) {
  _id,
  startTime,
  endTime
}`);

/**
 * Get ALL confirmed bookings for a host by slug (for real-time booking page)
 */
export const ALL_BOOKINGS_BY_HOST_SLUG_QUERY = defineQuery(`*[
  _type == "booking"
  && host->slug.current == $hostSlug
  && status == "confirmed"
] | order(startTime asc) {
  _id,
  startTime,
  endTime
}`);
