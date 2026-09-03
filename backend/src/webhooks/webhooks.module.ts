import { Module } from "@nestjs/common";
import { WebhookSenderService } from "./webhook-sender.service";

@Module({
  providers: [WebhookSenderService],
  exports: [WebhookSenderService],
})
export class WebhooksModule {}
