"use client";

import { Button } from "@/components/ui/button";
import { ExternalLinkIcon } from "lucide-react";
// logout from sanity-sdk
import { useLogOut } from "@sanity/sdk-react";

export function AdminHeader() {
  const logout = useLogOut();

  return (
    <header className="border-b bg-white dark:bg-zinc-900">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
        <Button variant="outline" asChild>
          <a
            href="/studio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            Open Sanity Studio
            <ExternalLinkIcon className="size-4" />
          </a>
        </Button>
      </div>
    </header>
  );
}
