import { SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { signSessionToken, verifySessionToken } from "./token";

const SECRET = "test-secret-that-is-at-least-32-characters-long";
const OTHER = "another-secret-that-is-at-least-32-characters!!";

describe("session tokens", () => {
  it("round-trips the user id and session version", async () => {
    const token = await signSessionToken("665f1c2e9b1e8a0012345678", SECRET);
    await expect(verifySessionToken(token, SECRET)).resolves.toEqual({
      userId: "665f1c2e9b1e8a0012345678",
      version: 0,
    });
    const bumped = await signSessionToken("665f1c2e9b1e8a0012345678", SECRET, 3);
    await expect(verifySessionToken(bumped, SECRET)).resolves.toMatchObject({ version: 3 });
  });

  it("treats a token without a version as version 0", async () => {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("abc")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(SECRET));
    await expect(verifySessionToken(token, SECRET)).resolves.toEqual({ userId: "abc", version: 0 });
  });

  it("rejects garbage, empty and missing tokens", async () => {
    await expect(verifySessionToken("garbage", SECRET)).resolves.toBeNull();
    await expect(verifySessionToken("", SECRET)).resolves.toBeNull();
    await expect(verifySessionToken(undefined, SECRET)).resolves.toBeNull();
  });

  it("rejects a token signed with another secret", async () => {
    const token = await signSessionToken("abc", OTHER);
    await expect(verifySessionToken(token, SECRET)).resolves.toBeNull();
  });

  it("rejects expired tokens", async () => {
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("abc")
      .setIssuedAt(Math.floor(Date.now() / 1000) - 120)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(new TextEncoder().encode(SECRET));
    await expect(verifySessionToken(token, SECRET)).resolves.toBeNull();
  });

  it("rejects the unsigned 'none' algorithm", async () => {
    const header = Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url");
    const body = Buffer.from(JSON.stringify({ sub: "abc" })).toString("base64url");
    await expect(verifySessionToken(`${header}.${body}.`, SECRET)).resolves.toBeNull();
  });

  it("treats a missing or short secret as no session", async () => {
    await expect(verifySessionToken("x.y.z", "short")).resolves.toBeNull();
    await expect(signSessionToken("abc", "short")).rejects.toThrow(/AUTH_SECRET/);
  });
});
