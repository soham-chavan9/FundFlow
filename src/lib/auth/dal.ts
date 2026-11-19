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
  return user ? toCurrentUser(user) : null;
});

/** For pages and Server Actions: redirects to /login when signed out. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
