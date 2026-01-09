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
      name: "meetLink",
      title: "Google Meet Link",
      type: "url",
      description: "Google Meet video conferencing link",
      readOnly: true,
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
      meetingTypeName: "meetingType.name",
      meetingTypeDuration: "meetingType.duration",
    },
    prepare({
      guestName,
      startTime,
      hostName,
      meetingTypeName,
      meetingTypeDuration,
    }) {
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
        subtitle: `${date} ${duration}`,
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
