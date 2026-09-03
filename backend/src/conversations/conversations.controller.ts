import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { ConversationsService } from "./conversations.service";
import { TenantApiKeyGuard } from "../tenants/tenant-api-key.guard";
import { ParticipantIdentifier } from "./participant-identifier.dto";

// Kullanici istegi: kiracidan gelen TUM istekler API anahtariyla
// (X-Api-Key header) dogrulanir - TenantApiKeyGuard bunu saglar ve
// request.tenant'i doldurur.
@UseGuards(TenantApiKeyGuard)
@Controller("conversations")
export class ConversationsController {
  constructor(private readonly service: ConversationsService) {}

  @Post()
  async create(
    @Req() request: Request,
    @Body() dto: { participantA: ParticipantIdentifier; participantB: ParticipantIdentifier }
  ) {
    const tenantId = (request as any).tenant.id;
    return this.service.createConversation(tenantId, dto.participantA, dto.participantB);
  }

  @Post(":id/messages")
  async sendMessage(
    @Req() request: Request,
    @Param("id") conversationId: string,
    @Body() dto: { senderParticipantId: string; body: string }
  ) {
    const tenantId = (request as any).tenant.id;
    return this.service.sendMessage(tenantId, conversationId, dto.senderParticipantId, dto.body);
  }

  @Get(":id/messages")
  async listMessages(
    @Req() request: Request,
    @Param("id") conversationId: string,
    @Body() dto: { requestingParticipantId: string }
  ) {
    const tenantId = (request as any).tenant.id;
    return this.service.listMessages(tenantId, conversationId, dto.requestingParticipantId);
  }
}
