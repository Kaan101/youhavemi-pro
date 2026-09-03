import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { AdminGuard } from "./admin.guard";
import { SettingsResolverService } from "../settings/settings-resolver.service";
import { PlatformPolicyOverrides, TenantSettings } from "../settings/tenant-settings.types";

// Kullanici istegi: yeni bir kiraci (musteri) olusturma VE ayarlarini
// yonetme - SADECE platform admin'i (biz) yapabilir, ADMIN_SECRET ile
// korunur.
@UseGuards(AdminGuard)
@Controller("admin/tenants")
export class TenantsController {
  constructor(
    private readonly service: TenantsService,
    private readonly settingsResolver: SettingsResolverService
  ) {}

  @Post()
  async create(@Body() dto: { name: string }) {
    // Kullanici istegi: API anahtari SADECE BU CEVAPTA duz metin
    // olarak donulur - bir daha GORUNTULENEMEZ, kiracinin bunu GUVENLI
    // bir yerde saklamasi gerekir.
    return this.service.createTenant(dto.name);
  }

  // Kullanici istegi: bir kiracinin PARAMETRIK ayarlarini (identityMode,
  // anonymitySide, messageRetentionDays, guardrailEnabled,
  // dailyMessageLimit) guncelleme.
  @Patch(":id/settings")
  async updateSettings(
    @Param("id") tenantId: string,
    @Body() dto: Partial<TenantSettings>
  ) {
    await this.settingsResolver.updateTenantSettings(tenantId, dto);
    return { message: "Ayarlar güncellendi." };
  }

  // Kullanici istegi: bir kiracinin, platform politikasiyla BIRLESTIRILMIS
  // (efektif) ayarlarini gorme - test/dogrulama icin kullanislidir.
  @Get(":id/effective-settings")
  async getEffectiveSettings(@Param("id") tenantId: string) {
    return this.settingsResolver.getEffectiveSettings(tenantId);
  }

  // Kullanici istegi: PLATFORM POLITIKASINI (biz) guncelleme - buradaki
  // her alan, TUM kiracilarin ayarini EZER (zorunlu kilar).
  @Patch("platform-policy")
  async updatePlatformPolicy(@Body() dto: PlatformPolicyOverrides) {
    await this.settingsResolver.updatePlatformPolicy(dto);
    return { message: "Platform politikası güncellendi." };
  }
}
