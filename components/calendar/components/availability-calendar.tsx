"use client";

import { useState, useMemo } from "react";
import { Calendar, Views, type View } from "react-big-calendar";
import withDragAndDrop, {
  type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";

import { localizer } from "../lib/localizer";
import { CALENDAR_CONFIG, MAX_TIME, MIN_TIME } from "../lib/constants";
import {
  calendarFormats,
  calendarMessages,
  formatTimeRange,
} from "../lib/formats";
import { useCalendarEvents } from "../hooks/use-calendar-events";
import { CalendarToolbar } from "./calendar-toolbar";
import type { TimeBlock, TimeBlockInteraction, SlotInfo } from "../types";

import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";

const DnDCalendar = withDragAndDrop<TimeBlock>(Calendar);

interface AvailabilityCalendarProps {
  initialBlocks?: TimeBlock[];
  onBlocksChange?: (blocks: TimeBlock[]) => void;
}

export function AvailabilityCalendar({
  initialBlocks = [],
}: AvailabilityCalendarProps) {
  const [view, setView] = useState<View>(Views.WEEK);
  const [date, setDate] = useState(new Date());

  const {
    events,
    handleSelectSlot,
    handleEventDrop,
    handleEventResize,
    removeBlock,
    copyDayToWeek,
    clearWeek,
  } = useCalendarEvents(initialBlocks);

  const isMonthView = view === Views.MONTH;

  const drillDown = (targetDate: Date) => {
    setDate(targetDate);
    setView(Views.WEEK);
  };

  const adaptEventArgs = (
    args: EventInteractionArgs<TimeBlock>,
  ): TimeBlockInteraction => ({
    event: args.event,
    start: args.start as Date,
    end: args.end as Date,
  });

  const onSlotSelect = (slotInfo: SlotInfo) => {
    isMonthView ? drillDown(slotInfo.start) : handleSelectSlot(slotInfo);
  };

  const onBlockSelect = (block: TimeBlock) => {
    isMonthView ? drillDown(block.start) : removeBlock(block.id);
  };

  // Month view: show time range, Week/Day view: show "Available"
  const getBlockTitle = (block: TimeBlock) =>
    isMonthView ? formatTimeRange(block.start, block.end) : "Available";

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
        titleAccessor={getBlockTitle}
        selectable
        resizable={!isMonthView}
        draggableAccessor={() => !isMonthView}
        popup
        onSelectSlot={onSlotSelect}
        onSelectEvent={onBlockSelect}
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
