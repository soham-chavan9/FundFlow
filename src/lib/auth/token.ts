import { SignJWT, jwtVerify } from "jose";

/**
 * Session tokens: HS256 JWTs carrying the user id and the account's session
 * version. Bumping the version on the account (password change, sign out
 * everywhere) makes every older token stale. Kept free of `server-only` and
 * `next/headers` so proxy.ts and unit tests can use it.
 */

export const SESSION_COOKIE = "ff_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function key(secret: string | undefined) {
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or shorter than 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionClaims {
  userId: string;
  /** Matches `UserDoc.sessionVersion`; tokens from before versioning count as 0. */
  version: number;
}

export async function signSessionToken(
  userId: string,
  secret: string | undefined = process.env.AUTH_SECRET,
  version = 0,
): Promise<string> {
  return new SignJWT({ sv: version })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key(secret));
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined = process.env.AUTH_SECRET,
): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || !payload.sub) return null;
    const version = Number.isInteger(payload.sv) ? (payload.sv as number) : 0;
    return { userId: payload.sub, version };
  } catch {
    return null;
  }
}
