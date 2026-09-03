import { Module } from "@nestjs/common";
import { ConversationsController } from "./conversations.controller";
import { ConversationsService } from "./conversations.service";
import { SettingsModule } from "../settings/settings.module";
import { GuardrailModule } from "../guardrail/guardrail.module";
import { WebhooksModule } from "../webhooks/webhooks.module";
import { TenantsModule } from "../tenants/tenants.module";

@Module({
  imports: [SettingsModule, GuardrailModule, WebhooksModule, TenantsModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
