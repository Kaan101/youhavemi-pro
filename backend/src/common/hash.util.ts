import { createHmac } from "crypto";

// Kullanici istegi: telefon numaralari ASLA duz metin saklanmaz -
// HMAC-SHA256 ile hash'lenir (YouHaveMi'nin orijinal projesindeki
// AYNI mantik).
export function hashPhoneNumber(phoneNumber: string): string {
  const secret = process.env.PHONE_HASH_SECRET ?? "dev-only-insecure-secret";
  return createHmac("sha256", secret).update(phoneNumber.trim()).digest("hex");
}
