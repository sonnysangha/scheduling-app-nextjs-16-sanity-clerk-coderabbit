"use client";

import { useDocuments } from "@sanity/sdk-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function TotalBookingsCard() {
  const { data: bookings } = useDocuments({
    documentType: "booking",
  });

  const totalCount = bookings?.length ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Total Bookings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{totalCount}</p>
      </CardContent>
    </Card>
  );
}
