import "server-only";
import bcrypt from "bcryptjs";

const COST = 12;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

let dummyHash: Promise<string> | undefined;

/**
 * Compares a password against a stored hash. When the user does not exist,
 * pass `null` and it still runs a full bcrypt compare, so response time does
 * not reveal which emails are registered.
 */
export async function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  if (hash) return bcrypt.compare(password, hash);
  dummyHash ??= bcrypt.hash("fundflow-timing-equaliser", COST);
  await bcrypt.compare(password, await dummyHash);
  return false;
}
