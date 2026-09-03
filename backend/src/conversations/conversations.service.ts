import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { hashPhoneNumber } from "../common/hash.util";
import { encryptReversible, decryptReversible } from "../common/encryption.util";
import { SettingsResolverService } from "../settings/settings-resolver.service";
import { GuardrailService } from "../guardrail/guardrail.service";
import { WebhookSenderService } from "../webhooks/webhook-sender.service";
import { ParticipantIdentifier } from "./participant-identifier.dto";

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsResolver: SettingsResolverService,
    private readonly guardrail: GuardrailService,
    private readonly webhookSender: WebhookSenderService
  ) {}

  // Kullanici istegi: kiracinin identityMode ayarina gore, verilen
  // tanimlayicinin GECERLI olup olmadigini kontrol edip, o kisiye ait
  // Participant kaydini BULUR ya da OLUSTURUR (find-or-create).
  private async resolveParticipant(
    tenantId: string,
    identifier: ParticipantIdentifier,
    identityMode: "phone" | "external_id" | "both"
  ) {
    if (identityMode === "phone" && !identifier.phoneNumber) {
      throw new BadRequestException("Bu kiracı için telefon numarası zorunlu.");
    }
    if (identityMode === "external_id" && !identifier.externalId) {
      throw new BadRequestException("Bu kiracı için externalId zorunlu.");
    }
    if (identityMode === "both" && !identifier.phoneNumber && !identifier.externalId) {
      throw new BadRequestException("Telefon numarası ya da externalId gerekli.");
    }

    const phoneNumberHash = identifier.phoneNumber ? hashPhoneNumber(identifier.phoneNumber) : undefined;

    // Kullanici istegi: ayni kiraci icinde, ayni telefon/externalId
    // ile ONCEDEN olusturulmus bir katilimci varsa ONU kullan -
    // tekrar tekrar yeni kayit ACILMASIN.
    const existing = await this.prisma.participant.findFirst({
      where: {
        tenantId,
        OR: [
          phoneNumberHash ? { phoneNumberHash } : undefined,
          identifier.externalId ? { externalId: identifier.externalId } : undefined,
        ].filter(Boolean) as any,
      },
    });
    if (existing) return existing;

    return this.prisma.participant.create({
      data: {
        tenantId,
        phoneNumberHash,
        externalId: identifier.externalId,
      },
    });
  }

  // Kullanici istegi: iki katilimci arasinda yeni bir konusma baslatir.
  // Konusmanin anonimlik kurali, O ANKI efektif ayardan COPYALANIR -
  // kiraci sonradan ayarini degistirse bile GECMIS konusmalar etkilenmez.
  async createConversation(
    tenantId: string,
    participantAIdentifier: ParticipantIdentifier,
    participantBIdentifier: ParticipantIdentifier
  ) {
    const settings = await this.settingsResolver.getEffectiveSettings(tenantId);

    const participantA = await this.resolveParticipant(tenantId, participantAIdentifier, settings.identityMode);
    const participantB = await this.resolveParticipant(tenantId, participantBIdentifier, settings.identityMode);

    const conversation = await this.prisma.conversation.create({
      data: {
        tenantId,
        participantAId: participantA.id,
        participantBId: participantB.id,
        anonymitySide: settings.anonymitySide,
      },
    });

    return {
      conversationId: conversation.id,
      participantAId: participantA.id,
      participantBId: participantB.id,
      anonymitySide: conversation.anonymitySide,
    };
  }

  // Kullanici istegi: bir konusmaya mesaj gonderir - guardrail (acikca)
  // ve gunluk limit kontrolunden GECER, govde sifrelenir, webhook
  // (varsa) tetiklenir.
  async sendMessage(tenantId: string, conversationId: string, senderParticipantId: string, body: string) {
    if (!body || !body.trim()) {
      throw new BadRequestException("Mesaj metni boş olamaz.");
    }

    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException("Konuşma bulunamadı.");
    }
    if (
      conversation.participantAId !== senderParticipantId &&
      conversation.participantBId !== senderParticipantId
    ) {
      throw new ForbiddenException("Bu konuşmanın bir parçası değilsin.");
    }

    const settings = await this.settingsResolver.getEffectiveSettings(tenantId);

    // Kullanici istegi: gunluk mesaj limiti (varsa) kontrol edilir.
    if (settings.dailyMessageLimit !== null) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const countToday = await this.prisma.message.count({
        where: { senderId: senderParticipantId, createdAt: { gte: since } },
      });
      if (countToday >= settings.dailyMessageLimit) {
        throw new ForbiddenException("Günlük mesaj gönderme limitine ulaşıldı.");
      }
    }

    // Kullanici istegi: guardrail acikken, basit kelime listesiyle
    // toksik icerik kontrolu yapilir.
    if (settings.guardrailEnabled) {
      const result = this.guardrail.evaluate(body);
      if (result.isToxic) {
        throw new BadRequestException("Mesaj, içerik kurallarına aykırı ifadeler içeriyor.");
      }
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId: senderParticipantId,
        bodyEncrypted: encryptReversible(body.trim()),
      },
    });

    // Kullanici istegi: webhook, ASIL cevabi BEKLETMEDEN (fire-and-forget)
    // tetiklenir.
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (tenant?.webhookUrl) {
      void this.webhookSender.send(tenant.webhookUrl, "message.created", {
        conversationId,
        messageId: message.id,
        senderId: senderParticipantId,
      });
    }

    return { messageId: message.id, createdAt: message.createdAt };
  }

  // Kullanici istegi: bir konusmadaki TUM mesajlari listeler - anonimlik
  // kurali "sender" ya da "both" ise, gonderenin kimligi (senderId)
  // GIZLENIR (sadece "bu SEN mi yoksa KARSI TARAF mi gonderdi" bilgisi
  // kalir, GERCEK participant ID'si donulmez).
  async listMessages(tenantId: string, conversationId: string, requestingParticipantId: string) {
    const conversation = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conversation || conversation.tenantId !== tenantId) {
      throw new NotFoundException("Konuşma bulunamadı.");
    }
    if (
      conversation.participantAId !== requestingParticipantId &&
      conversation.participantBId !== requestingParticipantId
    ) {
      throw new ForbiddenException("Bu konuşmanın bir parçası değilsin.");
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    const isAnonymous = conversation.anonymitySide !== "none";

    return messages.map((m) => ({
      id: m.id,
      body: decryptReversible(m.bodyEncrypted),
      isFromMe: m.senderId === requestingParticipantId,
      // Kullanici istegi: anonimlik kuralina gore, GERCEK gonderen
      // kimligi (senderId) sadece anonimlik "none" ise donulur.
      senderId: isAnonymous ? undefined : m.senderId,
      createdAt: m.createdAt,
    }));
  }
}
