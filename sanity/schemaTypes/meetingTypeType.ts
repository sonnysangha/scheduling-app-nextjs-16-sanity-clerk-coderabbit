import { defineField, defineType } from "sanity";
import { Clock } from "lucide-react";

export const meetingTypeType = defineType({
  name: "meetingType",
  title: "Meeting Type",
  type: "document",
  icon: Clock,
  fields: [
    defineField({
      name: "name",
      type: "string",
      description: "e.g., 'Quick Chat', 'Consultation', 'Discovery Call'",
      validation: (Rule) => [
        Rule.required().error("Meeting name is required"),
        Rule.max(50).warning("Keep it short and descriptive"),
      ],
    }),
    defineField({
      name: "slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 50,
      },
      validation: (Rule) =>
        Rule.required().error("Slug is required for the booking URL"),
    }),
    defineField({
      name: "duration",
      type: "number",
      description: "Duration in minutes",
      options: {
        list: [
          { title: "15 minutes", value: 15 },
          { title: "30 minutes", value: 30 },
          { title: "45 minutes", value: 45 },
          { title: "60 minutes", value: 60 },
          { title: "90 minutes", value: 90 },
        ],
        layout: "radio",
      },
      initialValue: 30,
      validation: (Rule) => Rule.required().error("Duration is required"),
    }),
    defineField({
      name: "description",
      type: "text",
      rows: 2,
      description: "Brief description shown on the booking page",
    }),
    defineField({
      name: "host",
      type: "reference",
      to: [{ type: "user" }],
      validation: (Rule) => Rule.required().error("Host is required"),
    }),
    defineField({
      name: "isDefault",
      type: "boolean",
      description: "Make this the default meeting type for your booking page",
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: "name",
      duration: "duration",
      hostName: "host.name",
    },
    prepare({ title, duration, hostName }) {
      return {
        title: title || "Untitled",
        subtitle: `${duration} min · ${hostName || "No host"}`,
      };
    },
  },
});
