"use client";

import { useDocuments } from "@sanity/sdk-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface DocumentCountCardProps {
  /** The Sanity document type to count */
  documentType: string;
  /** The title displayed on the card */
  title: string;
  /** Optional icon to display */
  icon?: LucideIcon;
}

/**
 * Generic card that displays the count of a specific Sanity document type.
 * Uses the Sanity SDK to fetch and count documents in real-time.
 */
export function DocumentCountCard({
  documentType,
  title,
  icon: Icon,
}: DocumentCountCardProps) {
  const { data: documents } = useDocuments({
    documentType,
  });

  const count = documents?.length ?? 0;

  return (
    <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-zinc-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full">
      {/* Subtle gradient accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-orange-500/5 rounded-bl-full" />
      
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-zinc-500">
          {title}
        </CardTitle>
        {Icon && (
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-100 to-amber-200/80 text-amber-700 shadow-sm">
            <Icon className="size-4" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-bold tracking-tight text-zinc-900">{count}</p>
      </CardContent>
    </Card>
  );
}
