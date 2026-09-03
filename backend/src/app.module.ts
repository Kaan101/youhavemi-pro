import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaModule } from "./common/prisma.module";
import { SettingsModule } from "./settings/settings.module";
import { TenantsModule } from "./tenants/tenants.module";
import { GuardrailModule } from "./guardrail/guardrail.module";
import { WebhooksModule } from "./webhooks/webhooks.module";
import { ConversationsModule } from "./conversations/conversations.module";

@Module({
  imports: [
    PrismaModule,
    SettingsModule,
    TenantsModule,
    GuardrailModule,
    WebhooksModule,
    ConversationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
