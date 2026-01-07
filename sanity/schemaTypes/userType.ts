import { defineField, defineType, defineArrayMember } from "sanity";
import { UserIcon } from "@sanity/icons";

export const userType = defineType({
  name: "user",
  title: "User",
  type: "document",
  icon: UserIcon,
  fields: [
    defineField({
      name: "clerkId",
      title: "Clerk ID",
      type: "string",
      validation: (Rule) => Rule.required().error("Clerk ID is required"),
      readOnly: true,
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (Rule) => Rule.email(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
      description: "Used for the public booking page URL",
    }),
    defineField({
      name: "availability",
      title: "Availability",
      type: "array",
      of: [defineArrayMember({ type: "availabilitySlot" })],
      description: "Time blocks when the user is available",
    }),
    defineField({
      name: "connectedAccounts",
      title: "Connected Accounts",
      type: "array",
      of: [defineArrayMember({ type: "connectedAccount" })],
      description: "Connected Google Calendar accounts",
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "email",
    },
  },
});
