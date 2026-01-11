"use client";

import { VideoIcon } from "lucide-react";
import { DocumentCountCard } from "./DocumentCountCard";

export function TotalMeetingTypesCard() {
  return <DocumentCountCard documentType="meetingType" title="Meeting Types" icon={VideoIcon} />;
}
