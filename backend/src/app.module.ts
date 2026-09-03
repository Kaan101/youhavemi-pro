import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaModule } from "./common/prisma.module";
import { SettingsModule } from "./settings/settings.module";
import { TenantsModule } from "./tenants/tenants.module";

@Module({
  imports: [PrismaModule, SettingsModule, TenantsModule],
  controllers: [AppController],
})
export class AppModule {}
