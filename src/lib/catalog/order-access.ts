import { createHash, randomBytes } from "node:crypto";

export function hashOrderAccess(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createOrderAccess() {
  const token = randomBytes(32).toString("hex");
  return { token, hash: hashOrderAccess(token) };
}
