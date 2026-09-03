import { createHmac, randomBytes } from "crypto";

// Kullanici istegi: API anahtari, telefon numarasi deseniyle AYNI
// mantikla - DUZ METIN olarak ASLA saklanmaz, sadece hash. Kiraciya
// SADECE OLUSTURULDUGU AN gosterilir.
export function hashApiKey(apiKey: string): string {
  const secret = process.env.API_KEY_HASH_SECRET ?? "dev-only-insecure-secret";
  return createHmac("sha256", secret).update(apiKey.trim()).digest("hex");
}

// Kullanici istegi: yeni bir kiraci olusturulurken, guclu/rastgele
// bir API anahtari uretilir (orn. "yhmp_live_" onekiyle - kolay
// tanina, log/hata mesajlarinda yanlislikla goze carpsa bile hangi
// servise ait oldugu belli olsun).
export function generateApiKey(): string {
  return `yhmp_live_${randomBytes(24).toString("hex")}`;
}
