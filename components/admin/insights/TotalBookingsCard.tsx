"use client";

import { CalendarCheckIcon } from "lucide-react";
import { DocumentCountCard } from "./DocumentCountCard";

export function TotalBookingsCard() {
  return <DocumentCountCard documentType="booking" title="Total Bookings" icon={CalendarCheckIcon} />;
}
