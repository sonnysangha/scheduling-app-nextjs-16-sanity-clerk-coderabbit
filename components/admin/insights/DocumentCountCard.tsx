"use client";

import { useDocuments } from "@sanity/sdk-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface DocumentCountCardProps {
  /** The Sanity document type to count */
  documentType: string;
  /** The title displayed on the card */
  title: string;
}

/**
 * Generic card that displays the count of a specific Sanity document type.
 * Uses the Sanity SDK to fetch and count documents in real-time.
 */
export function DocumentCountCard({
  documentType,
  title,
}: DocumentCountCardProps) {
  const { data: documents } = useDocuments({
    documentType,
  });

  const count = documents?.length ?? 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{count}</p>
      </CardContent>
    </Card>
  );
}
