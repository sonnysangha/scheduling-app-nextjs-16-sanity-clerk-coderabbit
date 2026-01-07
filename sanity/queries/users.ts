/**
 * User-related GROQ Queries
 *
 * All queries use `defineQuery` from `next-sanity` for TypeGen support.
 * Run `pnpm run typegen` after modifying queries to regenerate types.
 *
 * Derived types import from @/sanity/types (the generated file).
 */

import { defineQuery } from "next-sanity";
import type { USER_WITH_TOKENS_QUERYResult } from "@/sanity/types";

// Derived type from USER_WITH_TOKENS_QUERY result
export type ConnectedAccountWithTokens = NonNullable<
  NonNullable<USER_WITH_TOKENS_QUERYResult>["connectedAccounts"]
>[number];

/**
 * Get a user by their Clerk ID
 */
export const USER_BY_CLERK_ID_QUERY = defineQuery(`*[
  _type == "user"
  && clerkId == $clerkId
][0]{
  _id,
  _type,
  clerkId,
  name,
  email,
  slug,
  availability[]{
    _key,
    startDateTime,
    endDateTime
  },
  connectedAccounts[]{
    _key,
    accountId,
    email,
    provider,
    isDefault,
    connectedAt
  }
}`);

/**
 * Get a user by their public booking slug
 */
export const USER_BY_SLUG_QUERY = defineQuery(`*[
  _type == "user"
  && slug.current == $slug
][0]{
  _id,
  _type,
  name,
  email,
  slug,
  availability[]{
    _key,
    startDateTime,
    endDateTime
  }
}`);

/**
 * Get a user with their connected account tokens (for server-side only)
 */
export const USER_WITH_TOKENS_QUERY = defineQuery(`*[
  _type == "user"
  && clerkId == $clerkId
][0]{
  _id,
  connectedAccounts[]{
    _key,
    accountId,
    email,
    accessToken,
    refreshToken,
    expiryDate,
    isDefault
  }
}`);

/**
 * Find user ID by connected account key (for token refresh)
 */
export const USER_ID_BY_ACCOUNT_KEY_QUERY = defineQuery(`*[
  _type == "user"
  && defined(connectedAccounts[_key == $accountKey])
][0]{
  _id
}`);

/**
 * Get just the user ID by Clerk ID (minimal query for existence checks)
 */
export const USER_ID_BY_CLERK_ID_QUERY = defineQuery(`*[
  _type == "user"
  && clerkId == $clerkId
][0]{
  _id
}`);

/**
 * Get user with availability by Clerk ID
 */
export const USER_WITH_AVAILABILITY_QUERY = defineQuery(`*[
  _type == "user"
  && clerkId == $clerkId
][0]{
  _id,
  availability[]{
    _key,
    startDateTime,
    endDateTime
  }
}`);

/**
 * Get user with connected accounts for OAuth callback
 */
export const USER_WITH_CONNECTED_ACCOUNTS_QUERY = defineQuery(`*[
  _type == "user"
  && clerkId == $clerkId
][0]{
  _id,
  connectedAccounts[]{
    accountId
  }
}`);
