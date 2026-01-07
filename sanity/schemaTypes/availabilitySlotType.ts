import { defineField, defineType } from "sanity";
import { ClockIcon } from "@sanity/icons";

export const availabilitySlotType = defineType({
  name: "availabilitySlot",
  title: "Availability Slot",
  type: "object",
  icon: ClockIcon,
  fields: [
    defineField({
      name: "startDateTime",
      title: "Start",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "endDateTime",
      title: "End",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      start: "startDateTime",
      end: "endDateTime",
    },
    prepare({ start, end }) {
      if (!start || !end) return { title: "New Slot" };

      const startDate = new Date(start);
      const endDate = new Date(end);

      const dateStr = startDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      const startTime = startDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      const endTime = endDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

      return {
        title: `${dateStr}`,
        subtitle: `${startTime} - ${endTime}`,
      };
    },
  },
});
