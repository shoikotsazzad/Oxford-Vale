import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ characters). See .env.example.");
  return s;
}

export const sign = (value: string, length = 32) => createHmac("sha256", secret()).update(value).digest("base64url").slice(0, length);

export function verifySignature(value: string, signature: string | null | undefined, length = 32) {
  if (!signature) return false;
  const expected = Buffer.from(sign(value, length));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Access key for a guest's order page / payment page: /order/OV-…?key=… */
export const orderKey = (orderNo: string) => sign(`order:${orderNo}`, 24);
export const verifyOrderKey = (orderNo: string, key: string | null | undefined) => verifySignature(`order:${orderNo}`, key, 24);
