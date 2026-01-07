import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getGoogleAuthUrl } from "@/lib/google-calendar";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  // Create a state parameter with the user ID for CSRF protection
  // In production, you'd want to sign this or use a more secure method
  const state = Buffer.from(
    JSON.stringify({
      userId,
      timestamp: Date.now(),
    })
  ).toString("base64");

  const authUrl = getGoogleAuthUrl(state);

  redirect(authUrl);
}
