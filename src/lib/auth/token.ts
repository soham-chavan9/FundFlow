import { SignJWT, jwtVerify } from "jose";

/**
 * Session tokens: HS256 JWTs carrying only the user id. Kept free of
 * `server-only` and `next/headers` so proxy.ts and unit tests can use it.
 */

export const SESSION_COOKIE = "ff_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function key(secret: string | undefined) {
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or shorter than 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  userId: string,
  secret: string | undefined = process.env.AUTH_SECRET,
): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(key(secret));
}

export async function verifySessionToken(
  token: string | undefined,
  secret: string | undefined = process.env.AUTH_SECRET,
): Promise<{ userId: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"] });
    return typeof payload.sub === "string" && payload.sub ? { userId: payload.sub } : null;
  } catch {
    return null;
  }
}
