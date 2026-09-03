import { Module } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { TenantApiKeyGuard } from "./tenant-api-key.guard";

@Module({
  providers: [TenantsService, TenantApiKeyGuard],
  exports: [TenantsService, TenantApiKeyGuard],
})
export class TenantsModule {}
