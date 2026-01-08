/**
 * Get the base URL for the application.
 * Uses Vercel's URL in production, otherwise falls back to localhost.
 */
export function getBaseUrl(): string {
  // Vercel provides VERCEL_URL for preview/production deployments
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Allow explicit override via environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Default to localhost for development
  return "http://localhost:3000";
}

/**
 * Generate a URL-safe slug from a string.
 * Converts to lowercase, replaces non-alphanumeric characters with hyphens,
 * and trims leading/trailing hyphens.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50);
}
