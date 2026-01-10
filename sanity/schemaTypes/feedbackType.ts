import { defineType, defineField } from "sanity";
import { CommentIcon } from "@sanity/icons";

export const feedbackType = defineType({
  name: "feedback",
  title: "Feedback",
  type: "document",
  icon: CommentIcon,
  fields: [
    defineField({
      name: "user",
      type: "reference",
      to: [{ type: "user" }],
      validation: (Rule) =>
        Rule.required().error("A user reference is required"),
    }),
    defineField({
      name: "content",
      type: "text",
      validation: (Rule) => [
        Rule.required().error("Feedback content is required"),
        Rule.min(1).error("Feedback cannot be empty"),
      ],
    }),
    defineField({
      name: "createdAt",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "archived",
      type: "boolean",
      initialValue: false,
      description: "Archived feedback is hidden from the dashboard",
    }),
  ],
  preview: {
    select: {
      content: "content",
      createdAt: "createdAt",
      userName: "user.name",
      archived: "archived",
    },
    prepare({ content, createdAt, userName, archived }) {
      const truncatedContent = content
        ? content.substring(0, 50) + (content.length > 50 ? "..." : "")
        : "No content";
      return {
        title: archived ? `[Archived] ${truncatedContent}` : truncatedContent,
        subtitle: `${userName || "Unknown user"} - ${createdAt ? new Date(createdAt).toLocaleDateString() : "No date"}`,
      };
    },
  },
  orderings: [
    {
      title: "Newest First",
      name: "createdAtDesc",
      by: [{ field: "createdAt", direction: "desc" }],
    },
  ],
});
