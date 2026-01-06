"use client";

import { useState, useMemo } from "react";
import { Calendar, Views, type View } from "react-big-calendar";
import withDragAndDrop, {
  type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";

import { localizer } from "./lib/localizer";
import { CALENDAR_CONFIG, MAX_TIME, MIN_TIME } from "./lib/constants";
import {
  calendarFormats,
  calendarMessages,
  formatTimeRange,
} from "./lib/formats";
import { useCalendarEvents } from "./hooks/use-calendar-events";
import { CalendarToolbar } from "./calendar-toolbar";
import type { CalendarEvent, EventInteraction, SlotInfo } from "./types";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const DnDCalendar = withDragAndDrop<CalendarEvent>(Calendar);

interface AvailabilityCalendarProps {
  initialEvents?: CalendarEvent[];
  onEventsChange?: (events: CalendarEvent[]) => void;
}

export function AvailabilityCalendar({
  initialEvents = [],
}: AvailabilityCalendarProps) {
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());

  const {
    events,
    handleSelectSlot,
    handleEventDrop,
    handleEventResize,
    removeEvent,
    copyDayToWeek,
    clearWeek,
  } = useCalendarEvents(initialEvents);

  const isMonthView = view === Views.MONTH;

  // Drill down to week view for a specific date
  const drillDown = (targetDate: Date) => {
    setDate(targetDate);
    setView(Views.WEEK);
  };

  // Adapt library event args to our EventInteraction type
  const adaptEventArgs = (
    args: EventInteractionArgs<CalendarEvent>,
  ): EventInteraction => ({
    event: args.event,
    start: args.start as Date,
    end: args.end as Date,
  });

  // Handlers that behave differently in month view
  const onSlotSelect = (slotInfo: SlotInfo) => {
    isMonthView ? drillDown(slotInfo.start) : handleSelectSlot(slotInfo);
  };

  const onEventSelect = (event: CalendarEvent) => {
    isMonthView ? drillDown(event.start) : removeEvent(event.id);
  };

  // Event title: show time range in month view, title otherwise
  const getEventTitle = (event: CalendarEvent) =>
    isMonthView ? formatTimeRange(event.start, event.end) : event.title;

  // Custom toolbar with copy-to-week and clear-week functionality
  const ToolbarWithActions = useMemo(
    () =>
      function Toolbar(props: React.ComponentProps<typeof CalendarToolbar>) {
        return (
          <CalendarToolbar
            {...props}
            showCopyButton={!isMonthView}
            onCopyDayToWeek={(dayIndex, includeWeekends) =>
              copyDayToWeek(dayIndex, date, includeWeekends)
            }
            onClearWeek={() => clearWeek(date)}
          />
        );
      },
    [isMonthView, date, copyDayToWeek, clearWeek],
  );

  return (
    <div className="h-[calc(100vh-180px)] min-h-[400px] sm:min-h-[600px]">
      <DnDCalendar
        localizer={localizer}
        style={{ height: "100%" }}
        formats={calendarFormats}
        messages={calendarMessages}
        events={events}
        view={view}
        date={date}
        views={[Views.MONTH, Views.WEEK, Views.DAY]}
        onView={setView}
        onNavigate={setDate}
        onDrillDown={drillDown}
        startAccessor="start"
        endAccessor="end"
        titleAccessor={getEventTitle}
        selectable
        resizable={!isMonthView}
        draggableAccessor={() => !isMonthView}
        popup
        onSelectSlot={onSlotSelect}
        onSelectEvent={onEventSelect}
        onEventDrop={(args) =>
          !isMonthView && handleEventDrop(adaptEventArgs(args))
        }
        onEventResize={(args) =>
          !isMonthView && handleEventResize(adaptEventArgs(args))
        }
        min={MIN_TIME}
        max={MAX_TIME}
        step={CALENDAR_CONFIG.step}
        timeslots={CALENDAR_CONFIG.timeslots}
        components={{ toolbar: ToolbarWithActions }}
      />
    </div>
  );
}
