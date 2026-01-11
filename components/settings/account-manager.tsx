"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Loader2, Plus, Star, Trash2 } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import {
  disconnectGoogleAccount,
  setDefaultCalendarAccount,
} from "@/lib/actions/calendar";
import type { ConnectedAccountDisplay } from "@/sanity/queries/users";
import type { PlanType } from "@/lib/features";

interface AccountManagerProps {
  connectedAccounts: ConnectedAccountDisplay[];
  maxCalendars: number;
  plan: PlanType;
}

export function AccountManager({
  connectedAccounts,
  maxCalendars,
  plan,
}: AccountManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const currentCount = connectedAccounts.length;
  const isAtLimit = currentCount >= maxCalendars;
  const isUnlimited = maxCalendars === Infinity;

  const handleConnect = () => {
    // Redirect to OAuth connect endpoint
    window.location.href = "/api/calendar/connect";
  };

  const handleDisconnect = async (accountKey: string) => {
    setPendingAction(`disconnect-${accountKey}`);
    startTransition(async () => {
      try {
        await disconnectGoogleAccount(accountKey);
        router.refresh();
      } catch (error) {
        console.error("Failed to disconnect account:", error);
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleSetDefault = async (accountKey: string) => {
    setPendingAction(`default-${accountKey}`);
    startTransition(async () => {
      try {
        await setDefaultCalendarAccount(accountKey);
        router.refresh();
      } catch (error) {
        console.error("Failed to set default account:", error);
      } finally {
        setPendingAction(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Connected Google Accounts</h2>
          <p className="text-sm text-muted-foreground">
            Connect your Google Calendar to sync busy times and create events.
          </p>
          {!isUnlimited && (
            <p className="mt-1 text-sm text-muted-foreground">
              {currentCount}/{maxCalendars} calendars connected ({plan} plan)
            </p>
          )}
        </div>
        {isAtLimit ? (
          <Button asChild>
            <Link href="/pricing">
              Unlock more
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button onClick={handleConnect} disabled={isPending}>
            <Plus className="mr-2 h-4 w-4" />
            Connect Account
          </Button>
        )}
      </div>

      {connectedAccounts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No accounts connected yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect a Google account to sync your calendar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {connectedAccounts.map((account) => (
            <div
              key={account._key}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                  <FcGoogle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{account.email}</p>
                  {account.isDefault && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      Default for new bookings
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!account.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(account._key)}
                    disabled={isPending}
                  >
                    {pendingAction === `default-${account._key}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Star className="mr-1 h-3 w-3" />
                        Set Default
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect(account._key)}
                  disabled={isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {pendingAction === `disconnect-${account._key}` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="mr-1 h-3 w-3" />
                      Disconnect
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg bg-muted/50 p-4">
        <h3 className="font-medium">How it works</h3>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li>
            • Your busy times from connected calendars are shown on your
            availability page
          </li>
          <li>
            • When someone books a meeting, an event is created on your default
            calendar
          </li>
          <li>
            • Both you and your guest receive email invitations from Google
          </li>
        </ul>
      </div>
    </div>
  );
}
