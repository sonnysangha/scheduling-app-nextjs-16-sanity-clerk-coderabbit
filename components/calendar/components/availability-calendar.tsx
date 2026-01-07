"use client";

import { useState, useEffect } from "react";
import { Calendar, Views, type View } from "react-big-calendar";
import withDragAndDrop, {
  type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";
import { Loader2, Check, Cloud } from "lucide-react";

import { localizer } from "../lib/localizer";
import { CALENDAR_CONFIG, MAX_TIME, MIN_TIME } from "../lib/constants";
import {
  calendarFormats,
  calendarMessages,
  formatTimeRange,
} from "../lib/formats";
import { useCalendarEvents } from "../hooks/use-calendar-events";
import { CalendarToolbar } from "./calendar-toolbar";
import type {
  TimeBlock,
  BusyBlock,
  CalendarEvent,
  TimeBlockInteraction,
  SlotInfo,
} from "../types";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar);

interface AvailabilityCalendarProps {
  initialBlocks?: TimeBlock[];
  busyBlocks?: BusyBlock[];
  onBlocksChange?: (blocks: TimeBlock[]) => void;
}

export function AvailabilityCalendar({
  initialBlocks = [],
  busyBlocks = [],
}: AvailabilityCalendarProps) {
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());
  const [showSaved, setShowSaved] = useState(false);
  const [wasPending, setWasPending] = useState(false);

  const {
    events,
    isPending,
    handleSelectSlot,
    handleEventDrop,
    handleEventResize,
    removeBlock,
    copyDayToWeek,
    clearWeek,
  } = useCalendarEvents(initialBlocks);

  // Show "Saved" indicator when pending transitions to false
  useEffect(() => {
    if (wasPending && !isPending) {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
    setWasPending(isPending);
  }, [isPending, wasPending]);

  // Combine availability events with busy blocks
  const allEvents: CalendarEvent[] = [...events, ...busyBlocks];

  const isMonthView = view === Views.MONTH;

  // Check if an event is a busy block
  const isBusy = (event: CalendarEvent): event is BusyBlock =>
    "accountEmail" in event;

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
    isMonthView ? drillDown(slotInfo.start) : handleSelectSlot(slotInfo);
  };

  const onBlockSelect = (block: CalendarEvent) => {
    // Don't allow removing busy blocks
    if (isBusy(block)) return;
    isMonthView ? drillDown(block.start) : removeBlock(block.id);
  };

  // Get title for event
  const getBlockTitle = (block: CalendarEvent) => {
    if (isBusy(block)) {
      return isMonthView ? "Busy" : block.title;
    }
    return isMonthView ? formatTimeRange(block.start, block.end) : "Available";
  };

  // Style events - busy blocks are red, availability is default
  const eventStyleGetter = (event: CalendarEvent) => {
    if (isBusy(event)) {
      return {
        style: {
          backgroundColor: "#fecaca",
          borderColor: "#f87171",
          color: "#991b1b",
          opacity: 0.8,
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
      {/* Save Status Indicator */}
      <div
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium shadow-xl transition-all duration-300 ${
          isPending
            ? "translate-y-0 opacity-100 bg-blue-600 text-white"
            : showSaved
              ? "translate-y-0 opacity-100 bg-emerald-600 text-white"
              : "translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        {isPending ? (
          <>
            <Cloud className="h-5 w-5" />
            <span>Saving to cloud...</span>
            <Loader2 className="h-4 w-4 animate-spin" />
          </>
        ) : showSaved ? (
          <>
            <Check className="h-5 w-5" />
            <span>Changes saved!</span>
          </>
        ) : null}
      </div>
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
        draggableAccessor={(event) => !isMonthView && !isBusy(event)}
        popup
        onSelectSlot={onSlotSelect}
        onSelectEvent={onBlockSelect}
        onEventDrop={(args) => {
          if (!isMonthView && !isBusy(args.event)) {
            handleEventDrop(adaptEventArgs(args));
          }
        }}
        onEventResize={(args) => {
          if (!isMonthView && !isBusy(args.event)) {
            handleEventResize(adaptEventArgs(args));
          }
        }}
        min={MIN_TIME}
        max={MAX_TIME}
        step={CALENDAR_CONFIG.step}
        timeslots={CALENDAR_CONFIG.timeslots}
        components={{ toolbar: ToolbarWithActions }}
      />
    </div>
  );
}
