"use server";

import { auth } from "@clerk/nextjs/server";
import { writeClient } from "@/sanity/lib/writeClient";
import { USER_ID_BY_CLERK_ID_QUERY } from "@/sanity/queries/users";
import { client } from "@/sanity/lib/client";

export async function submitFeedback(
  content: string
): Promise<{ success: boolean }> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const user = await client.fetch(USER_ID_BY_CLERK_ID_QUERY, {
    clerkId: userId,
  });
  if (!user) {
    throw new Error("User not found");
  }

  await writeClient.create({
    _type: "feedback",
    user: { _type: "reference", _ref: user._id },
    content,
    createdAt: new Date().toISOString(),
  });

  return { success: true };
}
