"use client";

import { useEffect } from "react";

/**
 * Detects the visitor's timezone and stores it in a cookie.
 * This cookie is read by server components to display times correctly.
 *
 * Uses Intl.DateTimeFormat which is supported in all modern browsers.
 * The cookie is set to expire in 1 year and is accessible server-side.
 */
export function TimezoneDetector() {
  useEffect(() => {
    // Get the visitor's timezone (e.g., "America/New_York", "Europe/London")
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Only set cookie if timezone is detected and different from current
    if (timezone) {
      document.cookie = `timezone=${timezone}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, []);

  // Renders nothing - just sets the cookie
  return null;
}
