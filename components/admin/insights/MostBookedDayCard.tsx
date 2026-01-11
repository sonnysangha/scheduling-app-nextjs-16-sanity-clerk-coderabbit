"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import {
  useDocuments,
  useDocumentProjection,
  type DocumentHandle,
} from "@sanity/sdk-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarDaysIcon } from "lucide-react";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface BookingProjection {
  startTime: string | null;
}

interface BookingDayReporterProps extends DocumentHandle {
  onDay: (documentId: string, day: number) => void;
}

function BookingDayReporter({
  documentId,
  documentType,
  onDay,
}: BookingDayReporterProps) {
  const { data } = useDocumentProjection<BookingProjection>({
    documentId,
    documentType,
    projection: `{ startTime }`,
  });

  useEffect(() => {
    if (data?.startTime) {
      const day = new Date(data.startTime).getDay();
      onDay(documentId, day);
    }
  }, [data?.startTime, documentId, onDay]);

  return null;
}

export function MostBookedDayCard() {
  const { data: bookings } = useDocuments({
    documentType: "booking",
  });

  const [dayMap, setDayMap] = useState<Record<string, number>>({});

  const handleDay = useCallback((documentId: string, day: number) => {
    setDayMap((prev) => {
      if (prev[documentId] === day) return prev;
      return { ...prev, [documentId]: day };
    });
  }, []);

  const dayCounts = Object.values(dayMap).reduce(
    (acc, day) => {
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>,
  );

  let mostPopularDay = "No data";
  let mostPopularDayIndex = -1;
  const entries = Object.entries(dayCounts);
  if (entries.length > 0) {
    const [maxDayStr] = entries.reduce((max, entry) =>
      entry[1] > max[1] ? entry : max,
    );
    mostPopularDayIndex = Number(maxDayStr);
    mostPopularDay = DAYS[mostPopularDayIndex];
  }

  // Calculate max count for normalization
  const maxCount = Math.max(...Object.values(dayCounts), 1);

  return (
    <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-zinc-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col">
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-bl-full" />

      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-500">
          Most Booked Day
        </CardTitle>
        <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-amber-200/80 text-amber-700 shadow-sm">
          <CalendarDaysIcon className="size-4" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-3xl font-bold tracking-tight text-zinc-900">
          {mostPopularDay}
        </p>

        {/* Mini bar chart visualization */}
        <div className="flex items-end gap-1 h-8">
          {SHORT_DAYS.map((day, idx) => {
            const count = dayCounts[idx] || 0;
            const height =
              count > 0 ? Math.max((count / maxCount) * 100, 15) : 8;
            const isPopular = idx === mostPopularDayIndex;

            return (
              <div
                key={day}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  className={`w-full rounded-sm transition-all duration-300 ${
                    isPopular
                      ? "bg-gradient-to-t from-amber-500 to-orange-400"
                      : count > 0
                        ? "bg-amber-200"
                        : "bg-zinc-100"
                  }`}
                  style={{ height: `${height}%` }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-1 text-[10px] text-zinc-400">
          {SHORT_DAYS.map((day, idx) => (
            <div key={day} className="flex-1 flex justify-center">
              <span
                className={`flex items-center justify-center size-4 ${
                  idx === mostPopularDayIndex
                    ? "rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white font-semibold"
                    : ""
                }`}
              >
                {day[0]}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      {bookings?.map((booking) => (
        <Suspense key={booking.documentId} fallback={null}>
          <BookingDayReporter {...booking} onDay={handleDay} />
        </Suspense>
      ))}
    </Card>
  );
}
