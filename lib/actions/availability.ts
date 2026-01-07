"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { writeClient } from "@/sanity/lib/writeClient";
import { client } from "@/sanity/lib/client";

// Helper to format time as HH:mm
function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

// Get or create user document by Clerk ID
async function getOrCreateUser(clerkId: string) {
  // First try to find existing user
  const existingUser = await client.fetch<{ _id: string } | null>(
    `*[_type == "user" && clerkId == $clerkId][0]{ _id }`,
    { clerkId }
  );

  if (existingUser) {
    return existingUser;
  }

  // Get user details from Clerk
  const clerkUser = await currentUser();
  if (!clerkUser) {
    throw new Error("User not found in Clerk");
  }

  // Create new user document
  const newUser = await writeClient.create({
    _type: "user",
    clerkId,
    name:
      clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.username || "User",
    email: clerkUser.emailAddresses[0]?.emailAddress,
    availability: [],
  });

  return { _id: newUser._id };
}

// Get user by Clerk ID
async function getUserByClerkId(clerkId: string) {
  return client.fetch<{
    _id: string;
    availability?: Array<{
      _key: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      startDateTime: string;
      endDateTime: string;
    }>;
  } | null>(`*[_type == "user" && clerkId == $clerkId][0]`, { clerkId });
}

// Save a new availability block
export async function saveAvailabilityBlock(block: {
  tempId: string;
  start: Date;
  end: Date;
}): Promise<{ tempId: string; realKey: string }> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await getOrCreateUser(userId);
  const blockKey = crypto.randomUUID();

  await writeClient
    .patch(user._id)
    .setIfMissing({ availability: [] })
    .append("availability", [
      {
        _key: blockKey,
        dayOfWeek: block.start.getDay(),
        startTime: formatTime(block.start),
        endTime: formatTime(block.end),
        startDateTime: block.start.toISOString(),
        endDateTime: block.end.toISOString(),
      },
    ])
    .commit();

  return {
    tempId: block.tempId,
    realKey: blockKey,
  };
}

// Delete an availability block
export async function deleteAvailabilityBlock(blockKey: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await getOrCreateUser(userId);

  await writeClient
    .patch(user._id)
    .unset([`availability[_key=="${blockKey}"]`])
    .commit();
}

// Update an availability block (for drag/resize)
export async function updateAvailabilityBlock(block: {
  key: string;
  start: Date;
  end: Date;
}): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await getOrCreateUser(userId);

  await writeClient
    .patch(user._id)
    .set({
      [`availability[_key=="${block.key}"].dayOfWeek`]: block.start.getDay(),
      [`availability[_key=="${block.key}"].startDateTime`]:
        block.start.toISOString(),
      [`availability[_key=="${block.key}"].endDateTime`]:
        block.end.toISOString(),
      [`availability[_key=="${block.key}"].startTime`]: formatTime(block.start),
      [`availability[_key=="${block.key}"].endTime`]: formatTime(block.end),
    })
    .commit();
}

// Bulk save availability blocks (for copy to week)
export async function bulkSaveAvailabilityBlocks(
  blocks: Array<{ tempId: string; start: Date; end: Date }>
): Promise<Array<{ tempId: string; realKey: string }>> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await getOrCreateUser(userId);

  const newBlocks = blocks.map((block) => ({
    _key: crypto.randomUUID(),
    dayOfWeek: block.start.getDay(),
    startTime: formatTime(block.start),
    endTime: formatTime(block.end),
    startDateTime: block.start.toISOString(),
    endDateTime: block.end.toISOString(),
  }));

  await writeClient
    .patch(user._id)
    .setIfMissing({ availability: [] })
    .append("availability", newBlocks)
    .commit();

  return blocks.map((block, index) => ({
    tempId: block.tempId,
    realKey: newBlocks[index]._key,
  }));
}

// Bulk delete availability blocks (for clear week)
export async function bulkDeleteAvailabilityBlocks(
  blockKeys: string[]
): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await getOrCreateUser(userId);

  const unsetPaths = blockKeys.map((key) => `availability[_key=="${key}"]`);

  await writeClient.patch(user._id).unset(unsetPaths).commit();
}

// Get all availability blocks for the current user
export async function getAvailability(): Promise<
  Array<{
    _key: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    startDateTime: string;
    endDateTime: string;
  }>
> {
  const { userId } = await auth();
  if (!userId) return [];

  const user = await getUserByClerkId(userId);
  return user?.availability ?? [];
}
