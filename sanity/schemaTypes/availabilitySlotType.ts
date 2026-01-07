import { defineField, defineType } from "sanity";

export const availabilitySlotType = defineType({
  name: "availabilitySlot",
  title: "Availability Slot",
  type: "object",
  fields: [
    defineField({
      name: "dayOfWeek",
      title: "Day of Week",
      type: "number",
      description: "0 = Sunday, 6 = Saturday",
    }),
    defineField({
      name: "startTime",
      title: "Start Time",
      type: "string",
      description: "Time in HH:mm format (e.g., 09:00)",
    }),
    defineField({
      name: "endTime",
      title: "End Time",
      type: "string",
      description: "Time in HH:mm format (e.g., 17:00)",
    }),
    defineField({
      name: "startDateTime",
      title: "Start DateTime",
      type: "datetime",
      description: "Full datetime for specific date blocks",
    }),
    defineField({
      name: "endDateTime",
      title: "End DateTime",
      type: "datetime",
      description: "Full datetime for specific date blocks",
    }),
  ],
});
