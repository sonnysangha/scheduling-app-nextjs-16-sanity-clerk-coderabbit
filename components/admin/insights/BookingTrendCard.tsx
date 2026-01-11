"use client";

import { Suspense, useState, useCallback, useEffect, useMemo } from "react";
import {
  useDocuments,
  useDocumentProjection,
  type DocumentHandle,
} from "@sanity/sdk-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUpIcon, TrendingDownIcon, MinusIcon, CalendarCheckIcon } from "lucide-react";

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
  const isPositive = diff > 0;
  const isNegative = diff < 0;

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-500 to-orange-500 border-0 shadow-lg shadow-amber-500/25">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
      
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0 relative">
        <div>
          <CardTitle className="text-sm font-medium text-white/80">
            Bookings This Week
          </CardTitle>
        </div>
        <div className="flex size-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <CalendarCheckIcon className="size-6 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-end gap-4">
          <p className="text-6xl font-bold tracking-tight text-white">{thisWeekCount}</p>
          <div className="flex flex-col pb-2">
            <div className={`flex items-center gap-1 text-sm font-medium ${
              isPositive ? "text-emerald-200" : isNegative ? "text-red-200" : "text-white/70"
            }`}>
              <div className={`flex items-center justify-center size-5 rounded-full ${
                isPositive ? "bg-emerald-400/30" : isNegative ? "bg-red-400/30" : "bg-white/20"
              }`}>
                <TrendIcon className="size-3" />
              </div>
              <span>
                {diff > 0 ? "+" : ""}
                {diff}
              </span>
            </div>
            <p className="text-xs text-white/60 mt-1">
              vs {lastWeekCount} last week
            </p>
          </div>
        </div>
      </CardContent>
      {bookings?.map((booking) => (
        <Suspense key={booking.documentId} fallback={null}>
          <BookingDateReporter {...booking} onDate={handleDate} />
        </Suspense>
      ))}
    </Card>
  );
}
