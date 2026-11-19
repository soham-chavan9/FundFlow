import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession } from "./session";
import { findUserById, toCurrentUser } from "@/server/users";
import type { CurrentUser } from "@/lib/types";

/**
 * Data Access Layer entry point. Every server read and every Server Action
 * gets the user id from here, never from the client. Cached per request.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await readSession();
  if (!session) return null;
  const user = await findUserById(session.userId);
  // A token from before the account's last password change (or a deleted account) is stale.
  if (!user || (user.sessionVersion ?? 0) !== session.version) return null;
  return toCurrentUser(user);
});

/**
 * For pages and Server Actions: sends signed-out visitors to /login. `expired`
 * tells the proxy to drop a cookie that is validly signed but stale, so it
 * doesn't bounce the visitor straight back here.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?expired=1");
  return user;
}
