import { Injectable, Logger } from "@nestjs/common";

// Kullanici istegi: kiracinin webhookUrl'i varsa, onemli olaylarda
// (yeni mesaj vb.) HTTP POST ile bildirim gonderilir. Bu, isteği
// BLOKLAMADAN (fire-and-forget) calisir - webhook basarisiz olsa bile
// asil API cevabi ETKILENMEZ, sadece loglanir.
@Injectable()
export class WebhookSenderService {
  private readonly logger = new Logger(WebhookSenderService.name);

  async send(webhookUrl: string, eventType: string, payload: Record<string, unknown>) {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, payload, sentAt: new Date().toISOString() }),
      });
      if (!res.ok) {
        this.logger.warn(`Webhook basarisiz (${webhookUrl}): HTTP ${res.status}`);
      }
    } catch (err) {
      // Kullanici istegi: webhook hatasi, ASIL islemi (mesaj gonderme)
      // ASLA engellememeli - sadece loglanir.
      this.logger.warn(`Webhook gonderilemedi (${webhookUrl}): ${(err as Error).message}`);
    }
  }
}
