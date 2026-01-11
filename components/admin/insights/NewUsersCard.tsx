"use client";

import { UsersIcon } from "lucide-react";
import { DocumentCountCard } from "./DocumentCountCard";

export function NewUsersCard() {
  return <DocumentCountCard documentType="user" title="Total Users" icon={UsersIcon} />;
}
