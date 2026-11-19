import "server-only";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSessionToken, verifySessionToken } from "./token";

export async function createSession(userId: string, version = 0) {
  const token = await signSessionToken(userId, env().AUTH_SECRET, version);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function readSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySessionToken(token, env().AUTH_SECRET);
}

export async function deleteSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
