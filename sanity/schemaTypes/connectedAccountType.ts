import { defineField, defineType } from "sanity";
import { PlugIcon } from "@sanity/icons";

export const connectedAccountType = defineType({
  name: "connectedAccount",
  title: "Connected Account",
  type: "object",
  icon: PlugIcon,
  fields: [
    defineField({
      name: "accountId",
      title: "Account ID",
      type: "string",
      description: "Unique identifier from the provider (Google user ID)",
      validation: (Rule) => Rule.required(),
      readOnly: true,
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (Rule) => Rule.required().email(),
      readOnly: true,
    }),
    defineField({
      name: "provider",
      title: "Provider",
      type: "string",
      options: {
        list: [{ title: "Google", value: "google" }],
        layout: "radio",
      },
      initialValue: "google",
      readOnly: true,
    }),
    defineField({
      name: "accessToken",
      title: "Access Token",
      type: "string",
      hidden: true,
    }),
    defineField({
      name: "refreshToken",
      title: "Refresh Token",
      type: "string",
      hidden: true,
    }),
    defineField({
      name: "expiryDate",
      title: "Token Expiry Date",
      type: "number",
      description: "Unix timestamp when the access token expires",
      hidden: true,
    }),
    defineField({
      name: "isDefault",
      title: "Default Account",
      type: "boolean",
      description: "Use this account for creating new calendar events",
      initialValue: false,
    }),
    defineField({
      name: "connectedAt",
      title: "Connected At",
      type: "datetime",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      email: "email",
      provider: "provider",
      isDefault: "isDefault",
    },
    prepare({ email, provider, isDefault }) {
      return {
        title: email || "No email",
        subtitle: `${provider || "google"}${isDefault ? " (default)" : ""}`,
      };
    },
  },
});
