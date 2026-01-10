"use client";

import { useDocuments } from "@sanity/sdk-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function TotalMeetingTypesCard() {
  const { data: meetingTypes } = useDocuments({
    documentType: "meetingType",
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Meeting Types
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{meetingTypes?.length ?? 0}</p>
      </CardContent>
    </Card>
  );
}
