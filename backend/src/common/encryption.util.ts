import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// Kullanici istegi: mesaj govdesi GERI DONDURULEBILIR sekilde
// sifrelenir (duz metin ASLA veritabaninda durmaz) - YouHaveMi'nin
// orijinal projesindeki AYNI mantik (AES-256-GCM).
function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET ?? "dev-only-insecure-secret";
  return scryptSync(secret, "youhavemi-pro-salt", 32);
}

export function encryptReversible(plainText: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptReversible(payload: string): string {
  const buffer = Buffer.from(payload, "base64");
  const iv = buffer.subarray(0, 12);
  const authTag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
