import { defineField, defineType } from "sanity";
import { CalendarIcon } from "@sanity/icons";

export const bookingType = defineType({
  name: "booking",
  title: "Booking",
  type: "document",
  icon: CalendarIcon,
  fields: [
    defineField({
      name: "host",
      title: "Host",
      type: "reference",
      to: [{ type: "user" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "meetingType",
      title: "Meeting Type",
      type: "reference",
      to: [{ type: "meetingType" }],
      description: "The type of meeting booked",
    }),
    defineField({
      name: "guestName",
      title: "Guest Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "guestEmail",
      title: "Guest Email",
      type: "string",
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: "startTime",
      title: "Start Time",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "endTime",
      title: "End Time",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "googleEventId",
      title: "Google Event ID",
      type: "string",
      description: "The ID of the event in Google Calendar",
      readOnly: true,
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Confirmed", value: "confirmed" },
          { title: "Cancelled", value: "cancelled" },
        ],
        layout: "radio",
      },
      initialValue: "confirmed",
    }),
    defineField({
      name: "notes",
      title: "Notes",
      type: "text",
      description: "Additional notes from the guest",
    }),
  ],
  preview: {
    select: {
      guestName: "guestName",
      startTime: "startTime",
      hostName: "host.name",
      status: "status",
      meetingTypeName: "meetingType.name",
      meetingTypeDuration: "meetingType.duration",
    },
    prepare({ guestName, startTime, hostName, status, meetingTypeName, meetingTypeDuration }) {
      const date = startTime
        ? new Date(startTime).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })
        : "No date";

      const duration = meetingTypeDuration ? `${meetingTypeDuration}min` : "";
      const type = meetingTypeName ? ` · ${meetingTypeName}` : "";

      return {
        title: `${guestName || "Guest"} → ${hostName || "Host"}${type}`,
        subtitle: `${date} ${duration}${status === "cancelled" ? " (Cancelled)" : ""}`,
      };
    },
  },
  orderings: [
    {
      title: "Start Time (Newest)",
      name: "startTimeDesc",
      by: [{ field: "startTime", direction: "desc" }],
    },
    {
      title: "Start Time (Oldest)",
      name: "startTimeAsc",
      by: [{ field: "startTime", direction: "asc" }],
    },
  ],
});
