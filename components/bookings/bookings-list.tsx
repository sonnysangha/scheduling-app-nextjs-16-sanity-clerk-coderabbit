"use client";

import { useTransition, useState } from "react";
import { format, isFuture, isToday } from "date-fns";
import {
  Calendar,
  Clock,
  User,
  Mail,
  MessageSquare,
  X,
  Loader2,
  Video,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cancelBooking } from "@/lib/actions/calendar";
import type { HostBooking } from "@/sanity/queries/bookings";
import type { AttendeeStatus } from "@/components/calendar/types";

type BookingWithStatuses = HostBooking & {
  guestStatus?: AttendeeStatus;
};

interface BookingsListProps {
  bookings: BookingWithStatuses[];
}

export function BookingsList({ bookings }: BookingsListProps) {
  const [isPending, startTransition] = useTransition();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Show upcoming confirmed bookings (cancelled ones are filtered out by query)
  const activeBookings = bookings.filter((b) => {
    return isFuture(new Date(b.startTime));
  });

  const handleCancel = (bookingId: string) => {
    setCancellingId(bookingId);
    startTransition(async () => {
      try {
        await cancelBooking(bookingId);
        // The page will re-render via Sanity Live
      } catch (error) {
        console.error("Failed to cancel booking:", error);
      } finally {
        setCancellingId(null);
      }
    });
  };

  // Get status badge based on guest response from Google Calendar
  const getStatusBadge = (booking: BookingWithStatuses) => {
    if (booking.guestStatus === "accepted") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="h-3 w-3" />
          Accepted
        </span>
      );
    }
    if (booking.guestStatus === "tentative") {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
          <AlertCircle className="h-3 w-3" />
          Tentative
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
        <Clock className="h-3 w-3" />
        Awaiting Response
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {activeBookings.length} upcoming{" "}
          {activeBookings.length === 1 ? "booking" : "bookings"}
        </p>
      </div>

      {/* Bookings List */}
      {activeBookings.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No upcoming bookings</p>
          <p className="text-sm text-muted-foreground mt-1">
            Share your booking link to get started!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeBookings.map((booking) => {
            const startTime = new Date(booking.startTime);
            const endTime = new Date(booking.endTime);
            const isTodayBooking = isToday(startTime);

            return (
              <Card key={booking._id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row">
                    {/* Date column */}
                    <div
                      className={`flex flex-col items-center justify-center p-4 md:p-6 md:w-32 ${
                        isTodayBooking
                          ? "bg-blue-50 dark:bg-blue-950"
                          : "bg-slate-50 dark:bg-slate-900"
                      }`}
                    >
                      <span className="text-sm font-medium text-muted-foreground">
                        {format(startTime, "MMM")}
                      </span>
                      <span className="text-3xl font-bold">
                        {format(startTime, "d")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {format(startTime, "EEE")}
                      </span>
                      {isTodayBooking && (
                        <span className="mt-2 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                          Today
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-4 md:p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="space-y-3">
                          {/* Guest status badge */}
                          <div>{getStatusBadge(booking)}</div>

                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {format(startTime, "h:mm a")} -{" "}
                              {format(endTime, "h:mm a")}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.guestName}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <a
                              href={`mailto:${booking.guestEmail}`}
                              className="text-blue-600 hover:underline"
                            >
                              {booking.guestEmail}
                            </a>
                          </div>

                          {booking.notes && (
                            <div className="flex items-start gap-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <span className="text-sm text-muted-foreground">
                                {booking.notes}
                              </span>
                            </div>
                          )}

                          {booking.meetLink ? (
                            <a
                              href={booking.meetLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
                            >
                              <Video className="h-4 w-4" />
                              Join Google Meet
                            </a>
                          ) : booking.googleEventId ? (
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                Synced with Google Calendar
                              </span>
                            </div>
                          ) : null}
                        </div>

                        {/* Cancel button */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(booking._id)}
                            disabled={isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            {cancellingId === booking._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <X className="mr-1 h-4 w-4" />
                                Cancel
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
