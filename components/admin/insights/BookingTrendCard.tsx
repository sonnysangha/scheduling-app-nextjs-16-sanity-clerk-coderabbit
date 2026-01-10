"use client";

import { Suspense, useState, useCallback, useEffect, useMemo } from "react";
import {
  useDocuments,
  useDocumentProjection,
  type DocumentHandle,
} from "@sanity/sdk-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUpIcon, TrendingDownIcon, MinusIcon } from "lucide-react";

interface BookingProjection {
  startTime: string | null;
}

interface BookingDateReporterProps extends DocumentHandle {
  onDate: (documentId: string, date: string) => void;
}

function BookingDateReporter({
  documentId,
  documentType,
  onDate,
}: BookingDateReporterProps) {
  const { data } = useDocumentProjection<BookingProjection>({
    documentId,
    documentType,
    projection: `{ startTime }`,
  });

  useEffect(() => {
    if (data?.startTime) {
      onDate(documentId, data.startTime);
    }
  }, [data?.startTime, documentId, onDate]);

  return null;
}

function getWeekRange(weeksAgo: number): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - diffToMonday);
  thisMonday.setHours(0, 0, 0, 0);

  const start = new Date(thisMonday);
  start.setDate(thisMonday.getDate() - weeksAgo * 7);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export function BookingTrendCard() {
  const { data: bookings } = useDocuments({
    documentType: "booking",
  });

  const [dateMap, setDateMap] = useState<Record<string, string>>({});

  const handleDate = useCallback((documentId: string, date: string) => {
    setDateMap((prev) => {
      if (prev[documentId] === date) return prev;
      return { ...prev, [documentId]: date };
    });
  }, []);

  const { thisWeekCount, lastWeekCount } = useMemo(() => {
    const thisWeek = getWeekRange(0);
    const lastWeek = getWeekRange(1);

    let thisWeekCount = 0;
    let lastWeekCount = 0;

    for (const dateStr of Object.values(dateMap)) {
      const date = new Date(dateStr);
      if (date >= thisWeek.start && date <= thisWeek.end) {
        thisWeekCount++;
      } else if (date >= lastWeek.start && date <= lastWeek.end) {
        lastWeekCount++;
      }
    }

    return { thisWeekCount, lastWeekCount };
  }, [dateMap]);

  const diff = thisWeekCount - lastWeekCount;
  const TrendIcon =
    diff > 0 ? TrendingUpIcon : diff < 0 ? TrendingDownIcon : MinusIcon;
  const trendColor =
    diff > 0
      ? "text-green-600"
      : diff < 0
        ? "text-red-600"
        : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Bookings This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-bold">{thisWeekCount}</p>
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <TrendIcon className="size-4" />
            <span>
              {diff > 0 ? "+" : ""}
              {diff}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          vs {lastWeekCount} last week
        </p>
      </CardContent>
      {bookings?.map((booking) => (
        <Suspense key={booking.documentId} fallback={null}>
          <BookingDateReporter {...booking} onDate={handleDate} />
        </Suspense>
      ))}
    </Card>
  );
}
