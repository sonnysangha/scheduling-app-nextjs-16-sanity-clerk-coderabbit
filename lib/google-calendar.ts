import { google } from "googleapis";
import { writeClient } from "@/sanity/lib/writeClient";
import { client } from "@/sanity/lib/client";
import {
  USER_ID_BY_ACCOUNT_KEY_QUERY,
  type ConnectedAccountWithTokens,
} from "@/sanity/queries/users";

// OAuth2 client configuration
export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Generate OAuth URL for connecting a Google account
export function getGoogleAuthUrl(state: string) {
  const oauth2Client = createOAuth2Client();

  const scopes = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "select_account consent", // Force account picker and consent
    state,
  });
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

// Get Google user info (email, id, name)
export async function getGoogleUserInfo(accessToken: string) {
  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({ access_token: accessToken });

  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data } = await oauth2.userinfo.get();

  if (!data.id || !data.email) {
    throw new Error("Failed to get user info from Google");
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
  };
}

// Get a calendar client for a specific connected account
export async function getCalendarClient(account: ConnectedAccountWithTokens) {
  const oauth2Client = createOAuth2Client();

  oauth2Client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.expiryDate,
  });

  // Check if token needs refresh
  if (account.expiryDate && Date.now() >= account.expiryDate - 60000) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      if (!credentials.access_token || !credentials.expiry_date) {
        throw new Error("Invalid credentials received from refresh");
      }

      // Update tokens in Sanity
      await updateAccountTokens(account._key, {
        accessToken: credentials.access_token,
        expiryDate: credentials.expiry_date,
      });

      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error("Failed to refresh token:", error);
      throw new Error("Token refresh failed. Please reconnect your account.");
    }
  }

  return google.calendar({ version: "v3", auth: oauth2Client });
}

// Update account tokens in Sanity after refresh
async function updateAccountTokens(
  accountKey: string,
  tokens: { accessToken: string; expiryDate: number }
) {
  // Find the user with this account and update the tokens
  const user = await client.fetch(USER_ID_BY_ACCOUNT_KEY_QUERY, { accountKey });

  if (user) {
    await writeClient
      .patch(user._id)
      .set({
        [`connectedAccounts[_key=="${accountKey}"].accessToken`]:
          tokens.accessToken,
        [`connectedAccounts[_key=="${accountKey}"].expiryDate`]:
          tokens.expiryDate,
      })
      .commit();
  }
}

// Revoke Google OAuth token
export async function revokeGoogleToken(accessToken: string) {
  try {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${accessToken}`, {
      method: "POST",
    });
  } catch (error) {
    console.error("Failed to revoke token:", error);
    // Continue anyway - the token will expire eventually
  }
}
