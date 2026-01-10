"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import {
  useDocuments,
  useDocumentProjection,
  type DocumentHandle,
} from "@sanity/sdk-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

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
  const entries = Object.entries(dayCounts);
  if (entries.length > 0) {
    const [maxDayStr] = entries.reduce((max, entry) =>
      entry[1] > max[1] ? entry : max,
    );
    mostPopularDay = DAYS[Number(maxDayStr)];
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Most Booked Day
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{mostPopularDay}</p>
      </CardContent>
      {bookings?.map((booking) => (
        <Suspense key={booking.documentId} fallback={null}>
          <BookingDayReporter {...booking} onDay={handleDay} />
        </Suspense>
      ))}
    </Card>
  );
}
