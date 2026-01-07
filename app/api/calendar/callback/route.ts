import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  exchangeCodeForTokens,
  getGoogleUserInfo,
} from "@/lib/google-calendar";
import { writeClient } from "@/sanity/lib/writeClient";
import { client } from "@/sanity/lib/client";
import { USER_WITH_CONNECTED_ACCOUNTS_QUERY } from "@/sanity/queries/users";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=oauth_denied", request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/settings?error=missing_params", request.url)
    );
  }

  // Verify the user is authenticated
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Verify state parameter
  try {
    const stateData = JSON.parse(Buffer.from(state, "base64").toString());

    // Check if state is not too old (5 minutes)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return NextResponse.redirect(
        new URL("/settings?error=state_expired", request.url)
      );
    }

    // Verify the user ID matches
    if (stateData.userId !== userId) {
      return NextResponse.redirect(
        new URL("/settings?error=state_mismatch", request.url)
      );
    }
  } catch {
    return NextResponse.redirect(
      new URL("/settings?error=invalid_state", request.url)
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.access_token) {
      throw new Error("No access token received");
    }

    // Get user info from Google
    const googleUser = await getGoogleUserInfo(tokens.access_token);

    // Get or create the Sanity user document
    let user = await client.fetch(USER_WITH_CONNECTED_ACCOUNTS_QUERY, {
      clerkId: userId,
    });

    if (!user) {
      // Create user if doesn't exist
      const newUser = await writeClient.create({
        _type: "user",
        clerkId: userId,
        email: googleUser.email,
        name: googleUser.name || "User",
        connectedAccounts: [],
        availability: [],
      });
      user = { _id: newUser._id, connectedAccounts: [] };
    }

    // Check if this Google account is already connected
    const existingAccount = user.connectedAccounts?.find(
      (acc) => acc.accountId === googleUser.id
    );

    if (existingAccount) {
      // Update existing account tokens
      await writeClient
        .patch(user._id)
        .set({
          [`connectedAccounts[accountId=="${googleUser.id}"].accessToken`]:
            tokens.access_token,
          [`connectedAccounts[accountId=="${googleUser.id}"].refreshToken`]:
            tokens.refresh_token || existingAccount,
          [`connectedAccounts[accountId=="${googleUser.id}"].expiryDate`]:
            tokens.expiry_date,
        })
        .commit();

      return NextResponse.redirect(
        new URL("/settings?success=account_updated", request.url)
      );
    }

    // Add new connected account
    const isFirstAccount = !user.connectedAccounts?.length;

    await writeClient
      .patch(user._id)
      .setIfMissing({ connectedAccounts: [] })
      .append("connectedAccounts", [
        {
          _key: crypto.randomUUID(),
          accountId: googleUser.id,
          email: googleUser.email,
          provider: "google",
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || "",
          expiryDate: tokens.expiry_date || 0,
          isDefault: isFirstAccount, // First account is default
          connectedAt: new Date().toISOString(),
        },
      ])
      .commit();

    return NextResponse.redirect(
      new URL("/settings?success=account_connected", request.url)
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=oauth_failed", request.url)
    );
  }
}
