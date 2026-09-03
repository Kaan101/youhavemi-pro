import { Module } from "@nestjs/common";
import { SettingsResolverService } from "./settings-resolver.service";

@Module({
  providers: [SettingsResolverService],
  exports: [SettingsResolverService],
})
export class SettingsModule {}
