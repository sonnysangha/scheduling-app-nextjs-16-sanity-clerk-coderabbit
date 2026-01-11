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

// ============================================================================
// Shared Google Calendar Functions
// ============================================================================

/**
 * Represents a single event from Google Calendar.
 * Named to distinguish from UI CalendarEvent in components/calendar/types.ts
 */
export type GoogleCalendarEvent = {
  start: Date;
  end: Date;
  title: string;
  accountEmail: string;
};

/**
 * Fetch calendar events from connected accounts.
 * This is the core function used by both authenticated and public busy time fetchers.
 */
export async function fetchCalendarEvents(
  accounts: ConnectedAccountWithTokens[],
  startDate: Date,
  endDate: Date
): Promise<GoogleCalendarEvent[]> {
  const events: GoogleCalendarEvent[] = [];

  for (const account of accounts) {
    if (!account.accessToken || !account.refreshToken) continue;

    try {
      const calendar = await getCalendarClient(account);
      const { data } = await calendar.events.list({
        calendarId: "primary",
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      for (const event of data.items ?? []) {
        // Skip all-day events (they have date instead of dateTime)
        if (!event.start?.dateTime || !event.end?.dateTime) continue;
        events.push({
          start: new Date(event.start.dateTime),
          end: new Date(event.end.dateTime),
          title: event.summary ?? "Busy",
          accountEmail: account.email,
        });
      }
    } catch (error) {
      console.error(`Failed to fetch events for ${account.email}:`, error);
    }
  }

  return events;
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

// Attendee response status type
export type AttendeeStatus =
  | "accepted"
  | "declined"
  | "tentative"
  | "needsAction"
  | "unknown";

// Get event attendee status from Google Calendar
export async function getEventAttendeeStatus(
  account: ConnectedAccountWithTokens,
  eventId: string,
  guestEmail: string
): Promise<AttendeeStatus> {
  try {
    const calendar = await getCalendarClient(account);
    const response = await calendar.events.get({
      calendarId: "primary",
      eventId,
    });

    const attendee = response.data.attendees?.find(
      (a) => a.email?.toLowerCase() === guestEmail.toLowerCase()
    );

    if (!attendee?.responseStatus) {
      return "unknown";
    }

    return attendee.responseStatus as AttendeeStatus;
  } catch (error) {
    console.error("Failed to get event attendee status:", error);
    return "unknown";
  }
}

// Get guest attendee status from Google Calendar event
// Returns whether the event is cancelled/deleted
export async function getEventAttendeeStatuses(
  account: ConnectedAccountWithTokens,
  eventId: string,
  _hostEmail: string,
  guestEmail: string
): Promise<{ hostStatus: AttendeeStatus; guestStatus: AttendeeStatus }> {
  try {
    const calendar = await getCalendarClient(account);
    const response = await calendar.events.get({
      calendarId: "primary",
      eventId,
    });

    // Check if event was cancelled in Google Calendar
    if (response.data.status === "cancelled") {
      return { hostStatus: "declined", guestStatus: "declined" };
    }

    // Event exists and is not cancelled - get guest status
    const guestAttendee = response.data.attendees?.find(
      (a) => a.email?.toLowerCase() === guestEmail.toLowerCase()
    );

    return {
      // Host is the organizer, so if event exists, they accepted it
      hostStatus: "accepted",
      guestStatus:
        (guestAttendee?.responseStatus as AttendeeStatus) || "needsAction",
    };
  } catch (error: unknown) {
    // If event was deleted (404/410), treat as cancelled
    // Google API returns error code in different formats
    const gaxiosError = error as {
      code?: number;
      response?: { status?: number };
    };
    const errorCode = gaxiosError.code ?? gaxiosError.response?.status;
    if (errorCode === 404 || errorCode === 410) {
      return { hostStatus: "declined", guestStatus: "declined" };
    }
    console.error("Failed to get event attendee statuses:", error);
    // On error, assume event still exists but status unknown
    return { hostStatus: "accepted", guestStatus: "unknown" };
  }
}
