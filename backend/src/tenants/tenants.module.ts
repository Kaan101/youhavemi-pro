import { Module } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { TenantApiKeyGuard } from "./tenant-api-key.guard";
import { TenantsController } from "./tenants.controller";
import { SettingsModule } from "../settings/settings.module";

@Module({
  imports: [SettingsModule],
  controllers: [TenantsController],
  providers: [TenantsService, TenantApiKeyGuard],
  exports: [TenantsService, TenantApiKeyGuard],
})
export class TenantsModule {}
