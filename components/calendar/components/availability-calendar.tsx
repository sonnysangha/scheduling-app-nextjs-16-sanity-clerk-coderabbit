"use client";

import { useState, useTransition } from "react";
import { Calendar, Views, type View } from "react-big-calendar";
import withDragAndDrop, {
  type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";
import {
  Loader2,
  Save,
  Undo2,
  Clock,
  User,
  Mail,
  Video,
  ExternalLink,
} from "lucide-react";
import { format, differenceInMinutes, isBefore, startOfDay } from "date-fns";

import { localizer } from "../lib/localizer";
import {
  CALENDAR_CONFIG,
  MAX_TIME,
  MIN_TIME,
  AVAILABILITY_COLORS,
  BUSY_BLOCK_COLORS,
  BOOKING_STATUS_COLORS,
} from "../lib/constants";
import {
  calendarFormats,
  calendarMessages,
  formatTimeRange,
} from "../lib/formats";
import { useCalendarEvents } from "../hooks/use-calendar-events";
import { CalendarToolbar } from "./calendar-toolbar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { saveAvailability } from "@/lib/actions/availability";
import type {
  TimeBlock,
  BusyBlock,
  BookedBlock,
  CalendarEvent,
  TimeBlockInteraction,
  SlotInfo,
} from "../types";
import { isBusyBlock, isBookedBlock } from "../types";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar);

interface AvailabilityCalendarProps {
  initialBlocks?: TimeBlock[];
  busyBlocks?: BusyBlock[];
  bookedBlocks?: BookedBlock[];
}

export function AvailabilityCalendar({
  initialBlocks = [],
  busyBlocks = [],
  bookedBlocks = [],
}: AvailabilityCalendarProps) {
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<BookedBlock | null>(
    null,
  );
  const [isSaving, startSaveTransition] = useTransition();

  const {
    events,
    hasChanges,
    handleSelectSlot,
    handleEventDrop,
    handleEventResize,
    removeBlock,
    copyDayToWeek,
    clearWeek,
    discardChanges,
    markAsSaved,
    getEventsForSave,
  } = useCalendarEvents(initialBlocks);

  // Format duration in a readable way
  const formatDuration = (start: Date, end: Date) => {
    const mins = differenceInMinutes(end, start);
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  // Handle save
  const handleSave = () => {
    startSaveTransition(async () => {
      try {
        const blocksToSave = getEventsForSave();
        const savedBlocks = await saveAvailability(blocksToSave);
        // Update local state with real IDs from Sanity
        const newBlocks: TimeBlock[] = savedBlocks.map((b) => ({
          id: b.id,
          start: new Date(b.start),
          end: new Date(b.end),
        }));
        markAsSaved(newBlocks);
      } catch (error) {
        console.error("Failed to save:", error);
        // Could add toast notification here
      }
    });
  };

  // Combine availability events with busy blocks and booked meetings
  const allEvents: CalendarEvent[] = [
    ...events,
    ...busyBlocks,
    ...bookedBlocks,
  ];

  const isMonthView = view === Views.MONTH;
  const now = new Date();
  const todayStart = startOfDay(now);

  // Style past time slots as disabled
  const slotPropGetter = (date: Date) => {
    if (isBefore(date, now)) {
      return {
        style: {
          backgroundColor: AVAILABILITY_COLORS.background,
          cursor: "not-allowed",
        },
      };
    }
    return {};
  };

  // Style past days as disabled
  const dayPropGetter = (date: Date) => {
    if (isBefore(date, todayStart)) {
      return {
        style: {
          backgroundColor: AVAILABILITY_COLORS.backgroundHover,
        },
      };
    }
    return {};
  };

  const drillDown = (targetDate: Date) => {
    setDate(targetDate);
    setView(Views.WEEK);
  };

  const adaptEventArgs = (
    args: EventInteractionArgs<CalendarEvent>,
  ): TimeBlockInteraction => ({
    event: args.event as TimeBlock,
    start: args.start as Date,
    end: args.end as Date,
  });

  const onSlotSelect = (slotInfo: SlotInfo) => {
    // Don't allow selecting slots in the past
    if (isBefore(slotInfo.end, now)) return;

    isMonthView ? drillDown(slotInfo.start) : handleSelectSlot(slotInfo);
  };

  const onBlockSelect = (block: CalendarEvent) => {
    // Show dialog for booked blocks
    if (isBookedBlock(block)) {
      setSelectedBooking(block);
      return;
    }
    // Don't allow removing busy blocks
    if (isBusyBlock(block)) return;
    isMonthView ? drillDown(block.start) : removeBlock(block.id);
  };

  // Get status indicator for booking based on guest response
  const getStatusIndicator = (block: BookedBlock) => {
    switch (block.attendeeStatus) {
      case "accepted":
        return "✓";
      case "declined":
        return "✗";
      case "tentative":
        return "?";
      default:
        return "";
    }
  };

  // Get title for event
  const getBlockTitle = (block: CalendarEvent) => {
    if (isBusyBlock(block)) {
      return isMonthView ? "Busy" : block.title;
    }
    if (isBookedBlock(block)) {
      const indicator = getStatusIndicator(block);
      return indicator ? `${indicator} ${block.guestName}` : block.guestName;
    }
    return isMonthView ? formatTimeRange(block.start, block.end) : "Available";
  };

  // Style events based on type and guest attendee status
  const eventStyleGetter = (event: CalendarEvent) => {
    if (isBusyBlock(event)) {
      return {
        style: {
          backgroundColor: BUSY_BLOCK_COLORS.background,
          borderColor: BUSY_BLOCK_COLORS.border,
          color: BUSY_BLOCK_COLORS.text,
          opacity: 0.8,
        },
      };
    }
    if (isBookedBlock(event)) {
      const statusColors =
        event.attendeeStatus && event.attendeeStatus in BOOKING_STATUS_COLORS
          ? BOOKING_STATUS_COLORS[
              event.attendeeStatus as keyof typeof BOOKING_STATUS_COLORS
            ]
          : BOOKING_STATUS_COLORS.default;
      return {
        style: {
          backgroundColor: statusColors.background,
          borderColor: statusColors.border,
          color: statusColors.text,
          fontWeight: 600,
        },
      };
    }
    return {};
  };

  const ToolbarWithActions = (
    props: React.ComponentProps<typeof CalendarToolbar>,
  ) => (
    <CalendarToolbar
      {...props}
      showCopyButton={!isMonthView}
      onCopyDayToWeek={(dayIndex, includeWeekends) =>
        copyDayToWeek(dayIndex, date, includeWeekends)
      }
      onClearWeek={() => clearWeek(date)}
    />
  );

  return (
    <div className="relative h-[calc(100vh-180px)] min-h-[400px] sm:min-h-[600px]">
      {/* Booking Details Dialog */}
      <Dialog
        open={!!selectedBooking}
        onOpenChange={(open) => !open && setSelectedBooking(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className={`h-3 w-3 rounded-full ${
                  selectedBooking?.attendeeStatus === "declined"
                    ? "bg-red-500"
                    : selectedBooking?.attendeeStatus === "tentative"
                      ? "bg-amber-500"
                      : selectedBooking?.attendeeStatus === "accepted"
                        ? "bg-green-600"
                        : "bg-gray-500"
                }`}
              />
              Meeting Details
            </DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 pt-2">
              {/* Guest Status Badge */}
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${
                  selectedBooking.attendeeStatus === "declined"
                    ? "bg-red-100 text-red-700"
                    : selectedBooking.attendeeStatus === "tentative"
                      ? "bg-amber-100 text-amber-700"
                      : selectedBooking.attendeeStatus === "accepted"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                }`}
              >
                {selectedBooking.attendeeStatus === "declined" &&
                  "Guest Declined"}
                {selectedBooking.attendeeStatus === "tentative" &&
                  "Guest Tentative"}
                {selectedBooking.attendeeStatus === "accepted" &&
                  "Guest Accepted"}
                {selectedBooking.attendeeStatus === "needsAction" &&
                  "Guest: Awaiting Response"}
                {!selectedBooking.attendeeStatus && "Guest Status Unknown"}
              </div>

              <div className="flex items-start gap-3">
                <User className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{selectedBooking.guestName}</p>
                  <p className="text-sm text-muted-foreground">Guest</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <a
                    href={`mailto:${selectedBooking.guestEmail}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {selectedBooking.guestEmail}
                  </a>
                  <p className="text-sm text-muted-foreground">Email</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {format(selectedBooking.start, "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(selectedBooking.start, "h:mm a")} –{" "}
                    {format(selectedBooking.end, "h:mm a")} (
                    {formatDuration(selectedBooking.start, selectedBooking.end)}
                    )
                  </p>
                </div>
              </div>
              {selectedBooking.meetLink && (
                <div className="flex items-start gap-3">
                  <Video className="h-5 w-5 mt-0.5 text-muted-foreground" />
                  <div>
                    <a
                      href={selectedBooking.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 font-medium text-blue-600 hover:underline"
                    >
                      Join Google Meet
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <p className="text-sm text-muted-foreground">Video call</p>
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedBooking(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Save/Discard Bar - shows when there are unsaved changes */}
      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full bg-white px-4 py-2 shadow-xl border">
          <span className="text-sm font-medium text-muted-foreground">
            Unsaved changes
          </span>
          <div className="h-4 w-px bg-border" />
          <Button
            variant="ghost"
            size="sm"
            onClick={discardChanges}
            disabled={isSaving}
          >
            <Undo2 className="h-4 w-4 mr-1" />
            Discard
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
          </Button>
        </div>
      )}

      <DnDCalendar
        localizer={localizer}
        style={{ height: "100%" }}
        formats={calendarFormats}
        messages={calendarMessages}
        events={allEvents}
        view={view}
        date={date}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        onView={setView}
        onNavigate={setDate}
        onDrillDown={drillDown}
        startAccessor="start"
        endAccessor="end"
        titleAccessor={getBlockTitle}
        eventPropGetter={eventStyleGetter}
        selectable
        resizable={!isMonthView}
        draggableAccessor={(event) =>
          !isMonthView && !isBusyBlock(event) && !isBookedBlock(event)
        }
        popup
        onSelectSlot={onSlotSelect}
        onSelectEvent={onBlockSelect}
        onEventDrop={(args) => {
          if (
            !isMonthView &&
            !isBusyBlock(args.event) &&
            !isBookedBlock(args.event)
          ) {
            handleEventDrop(adaptEventArgs(args));
          }
        }}
        onEventResize={(args) => {
          if (
            !isMonthView &&
            !isBusyBlock(args.event) &&
            !isBookedBlock(args.event)
          ) {
            handleEventResize(adaptEventArgs(args));
          }
        }}
        min={MIN_TIME}
        max={MAX_TIME}
        step={CALENDAR_CONFIG.step}
        timeslots={CALENDAR_CONFIG.timeslots}
        slotPropGetter={slotPropGetter}
        dayPropGetter={dayPropGetter}
        components={{ toolbar: ToolbarWithActions }}
      />
    </div>
  );
}
