"use client";

import { useState, useTransition } from "react";
import { Share2, Copy, Check, ExternalLink, Loader2, Plus, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getMeetingTypes,
  createMeetingType,
  getBookingLinkWithMeetingType,
} from "@/lib/actions/availability";
import type { MeetingTypeForHost } from "@/sanity/queries/meetingTypes";

type MeetingDuration = 15 | 30 | 45 | 60 | 90;

const DURATION_OPTIONS: Array<{ value: MeetingDuration; label: string }> = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "60 minutes" },
  { value: 90, label: "90 minutes" },
];

export function ShareLinkDialog() {
  const [open, setOpen] = useState(false);
  const [meetingTypes, setMeetingTypes] = useState<MeetingTypeForHost[]>([]);
  const [selectedMeetingType, setSelectedMeetingType] = useState<MeetingTypeForHost | null>(null);
  const [bookingUrl, setBookingUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDuration, setNewTypeDuration] = useState<MeetingDuration>(30);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      startTransition(async () => {
        try {
          const types = await getMeetingTypes();
          setMeetingTypes(types);

          // Auto-select default or first meeting type
          const defaultType = types.find((t) => t.isDefault) || types[0];
          if (defaultType) {
            setSelectedMeetingType(defaultType);
            const result = await getBookingLinkWithMeetingType(defaultType.slug ?? "");
            setBookingUrl(result.url);
          } else {
            // No meeting types, show create form
            setIsCreatingType(true);
          }
        } catch (error) {
          console.error("Failed to load meeting types:", error);
        }
      });
    } else {
      // Reset state on close
      setIsCreatingType(false);
      setNewTypeName("");
      setNewTypeDuration(30);
    }
  };

  const handleMeetingTypeChange = (typeId: string) => {
    const type = meetingTypes.find((t) => t._id === typeId);
    if (type) {
      setSelectedMeetingType(type);
      startTransition(async () => {
        const result = await getBookingLinkWithMeetingType(type.slug ?? "");
        setBookingUrl(result.url);
      });
    }
  };

  const handleCreateMeetingType = () => {
    if (!newTypeName.trim()) return;

    startTransition(async () => {
      try {
        const newType = await createMeetingType({
          name: newTypeName.trim(),
          duration: newTypeDuration,
          isDefault: meetingTypes.length === 0,
        });

        setMeetingTypes((prev) => [...prev, newType]);
        setSelectedMeetingType(newType);
        setIsCreatingType(false);
        setNewTypeName("");
        setNewTypeDuration(30);

        const result = await getBookingLinkWithMeetingType(newType.slug ?? "");
        setBookingUrl(result.url);
      } catch (error) {
        console.error("Failed to create meeting type:", error);
      }
    });
  };

  const handleCopy = async () => {
    if (!bookingUrl) return;

    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleVisit = () => {
    if (bookingUrl) {
      window.open(bookingUrl, "_blank");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Your Booking Link</DialogTitle>
          <DialogDescription>
            Select a meeting type and share the link with anyone who wants to book time with you.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {isPending && !selectedMeetingType && !isCreatingType ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isCreatingType ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meeting-name">Meeting Name</Label>
                <Input
                  id="meeting-name"
                  placeholder="e.g., Quick Chat, Consultation"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meeting-duration">Duration</Label>
                <Select
                  value={newTypeDuration.toString()}
                  onValueChange={(v) => setNewTypeDuration(Number.parseInt(v) as MeetingDuration)}
                >
                  <SelectTrigger id="meeting-duration">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        <span className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" />
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleCreateMeetingType}
                  disabled={!newTypeName.trim() || isPending}
                  className="flex-1"
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Create Meeting Type
                </Button>
                {meetingTypes.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreatingType(false)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Meeting Type Selector */}
              <div className="space-y-2">
                <Label>Meeting Type</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedMeetingType?._id ?? ""}
                    onValueChange={handleMeetingTypeChange}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select meeting type" />
                    </SelectTrigger>
                    <SelectContent>
                      {meetingTypes.map((type) => (
                        <SelectItem key={type._id} value={type._id}>
                          <span className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            {type.name} ({type.duration} min)
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCreatingType(true)}
                    title="Create new meeting type"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Duration Badge */}
              {selectedMeetingType && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{selectedMeetingType.duration} minute meeting</span>
                </div>
              )}

              {/* Booking URL */}
              {bookingUrl ? (
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      value={bookingUrl}
                      readOnly
                      className="flex-1 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={handleCopy}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleCopy}
                      className="flex-1"
                      variant={copied ? "outline" : "default"}
                      disabled={isPending}
                    >
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Link
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleVisit}
                      className="flex-1"
                      disabled={isPending}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Visit Page
                    </Button>
                  </div>
                </>
              ) : isPending ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : null}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
