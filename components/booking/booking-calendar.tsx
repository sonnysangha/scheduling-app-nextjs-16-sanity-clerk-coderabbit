"use client";

import { useState, useTransition } from "react";
import { format, startOfDay, isBefore } from "date-fns";
import {
  Loader2,
  Clock,
  User,
  Mail,
  MessageSquare,
  Check,
  Globe,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createBooking } from "@/lib/actions/booking";

// Slot types
type SerializedSlot = { start: string; end: string };
type TimeSlot = { start: Date; end: Date };

interface BookingCalendarProps {
  hostSlug: string;
  hostName: string;
  meetingTypeSlug: string;
  meetingTypeName: string;
  duration: number;
  // Server pre-computes these using the visitor's timezone (from cookie)
  availableDates: string[];
  slotsByDate: Record<string, SerializedSlot[]>;
  // Visitor's detected timezone (e.g., "America/New_York")
  timezone: string;
}

type BookingStep = "select-time" | "enter-details" | "confirmed";

export function BookingCalendar({
  hostSlug,
  hostName,
  meetingTypeSlug,
  meetingTypeName,
  duration,
  availableDates,
  slotsByDate,
  timezone,
}: BookingCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [month, setMonth] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [step, setStep] = useState<BookingStep>("select-time");
  const [isPending, startTransition] = useTransition();

  // Form state
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const today = startOfDay(new Date());

  // Convert to Set for O(1) lookup
  const availableDatesSet = new Set(availableDates);

  // Check if a date has availability
  const hasAvailability = (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd");
    return availableDatesSet.has(dateStr);
  };

  // Get slots for selected date (deserialize from server data)
  const getSlotsForDate = (selectedDate: Date): TimeSlot[] => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const serializedSlots = slotsByDate[dateStr] ?? [];
    return serializedSlots.map((s) => ({
      start: new Date(s.start),
      end: new Date(s.end),
    }));
  };

  // Get current slots
  const availableSlots = date ? getSlotsForDate(date) : [];

  const handleDateSelect = (newDate: Date | undefined) => {
    setDate(newDate);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleContinue = () => {
    if (selectedSlot) {
      setStep("enter-details");
    }
  };

  const handleBack = () => {
    setStep("select-time");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !guestName || !guestEmail) return;

    setError(null);

    startTransition(async () => {
      try {
        await createBooking({
          hostSlug,
          meetingTypeSlug,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
          guestName,
          guestEmail,
          notes: notes || undefined,
        });
        setStep("confirmed");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create booking",
        );
      }
    });
  };

  // Confirmed state
  if (step === "confirmed" && selectedSlot) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-6">
            <Check className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Booking Confirmed!
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Your {meetingTypeName} with {hostName} has been scheduled.
          </p>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm font-medium text-blue-700 dark:text-blue-300 mb-6">
            <Clock className="h-3.5 w-3.5" />
            {duration} minutes
          </div>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 text-left max-w-sm mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-5 w-5 text-slate-400" />
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {format(selectedSlot.start, "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {format(selectedSlot.start, "h:mm a")} -{" "}
                  {format(selectedSlot.end, "h:mm a")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-slate-400" />
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Confirmation sent to {guestEmail}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Details form
  if (step === "enter-details" && selectedSlot) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <button
            type="button"
            onClick={handleBack}
            className="text-sm text-slate-500 hover:text-slate-700 mb-4 flex items-center gap-1"
          >
            ← Back to calendar
          </button>

          <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-slate-900 dark:text-white">
                {meetingTypeName}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                <Clock className="h-3 w-3" />
                {duration} min
              </span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {format(selectedSlot.start, "EEEE, MMMM d, yyyy")}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {format(selectedSlot.start, "h:mm a")} -{" "}
              {format(selectedSlot.end, "h:mm a")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Your Name
              </Label>
              <Input
                id="name"
                value={guestName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setGuestName(e.target.value)
                }
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={guestEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setGuestEmail(e.target.value)
                }
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Notes (optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNotes(e.target.value)
                }
                placeholder="Any additional information..."
                rows={3}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isPending || !guestName || !guestEmail}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Calendar + time slots
  return (
    <Card className="overflow-hidden">
      <CardContent className="relative p-0 md:pr-64">
        <div className="p-6">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            month={month}
            onMonthChange={setMonth}
            disabled={(day) => isBefore(day, today) || !hasAvailability(day)}
            showOutsideDays={false}
            className="bg-transparent p-0"
            formatters={{
              formatWeekdayName: (d) =>
                d.toLocaleString("en-US", { weekday: "short" }),
            }}
            modifiers={{
              available: (day) => hasAvailability(day) && !isBefore(day, today),
            }}
            modifiersClassNames={{
              available:
                "bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300",
            }}
          />
        </div>

        {/* Time slots panel */}
        <div className="inset-y-0 right-0 flex max-h-80 w-full flex-col border-t p-4 md:absolute md:max-h-none md:w-64 md:border-t-0 md:border-l md:overflow-y-auto">
          {!date ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
              <p>Select a date to view available times</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-slate-500 p-4">
              <p>
                No available times for this date. Please select another day.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                {format(date, "EEEE, MMM d")}
              </p>
              {availableSlots.map((slot) => (
                <Button
                  key={slot.start.toISOString()}
                  variant={
                    selectedSlot?.start.getTime() === slot.start.getTime()
                      ? "default"
                      : "outline"
                  }
                  onClick={() => handleSlotSelect(slot)}
                  className="w-full justify-start"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  {format(slot.start, "h:mm a")}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t px-6 py-5">
        <div className="flex flex-col gap-4 w-full md:flex-row md:items-center">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {date && selectedSlot ? (
              <>
                Selected:{" "}
                <span className="font-medium text-slate-900 dark:text-white">
                  {format(selectedSlot.start, "EEEE, MMMM d")}
                </span>{" "}
                at{" "}
                <span className="font-medium text-slate-900 dark:text-white">
                  {format(selectedSlot.start, "h:mm a")}
                </span>
              </>
            ) : (
              "Select a date and time for your meeting"
            )}
          </div>
          <Button
            onClick={handleContinue}
            disabled={!selectedSlot}
            className="w-full md:ml-auto md:w-auto"
          >
            Continue
          </Button>
        </div>
        {/* Timezone indicator */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Globe className="h-3 w-3" />
          <span>Times shown in {timezone.replace(/_/g, " ")}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
