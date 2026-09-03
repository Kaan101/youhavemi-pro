import { Injectable } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import {
  DEFAULT_TENANT_SETTINGS,
  TenantSettings,
  PlatformPolicyOverrides,
} from "./tenant-settings.types";

// Kullanici istegi: bu, mimarinin KALBI - her istekte, kiracinin
// KENDI sectigi ayarlarla, PLATFORM POLITIKASININ zorladigi degerleri
// birlestirip "ETKIN" (effective) ayari hesaplar. Sira ONEMLI:
// 1. Varsayilanlardan basla (en guvenli taraf).
// 2. Kiracinin KENDI ayarlariyla UZERINE yaz (varsa).
// 3. EN SON, platform politikasindaki (varsa) degerlerle TEKRAR
//    uzerine yaz - boylece platform HER ZAMAN son sozu soyler,
//    kiraci onu GECERSIZ KILAMAZ.
@Injectable()
export class SettingsResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async getEffectiveSettings(tenantId: string): Promise<TenantSettings> {
    const [tenant, policy] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
      this.prisma.platformPolicy.findUnique({ where: { id: "singleton" } }),
    ]);

    const tenantSettings = (tenant?.settings as Partial<TenantSettings>) ?? {};
    const platformOverrides = (policy?.overrides as PlatformPolicyOverrides) ?? {};

    // Kullanici istegi: sirali birlestirme - varsayilan -> kiraci ->
    // platform (platform HER ZAMAN kazanir).
    return {
      ...DEFAULT_TENANT_SETTINGS,
      ...tenantSettings,
      ...platformOverrides,
    };
  }

  // Kullanici istegi: admin ekranindan platform politikasini
  // guncelleme - orn. "guardrailEnabled: true" gonderilirse, TUM
  // kiracilar icin guardrail ARTIK KAPATILAMAZ hale gelir.
  async updatePlatformPolicy(overrides: PlatformPolicyOverrides): Promise<void> {
    await this.prisma.platformPolicy.upsert({
      where: { id: "singleton" },
      update: { overrides },
      create: { id: "singleton", overrides },
    });
  }

  // Kullanici istegi: kiracinin KENDI ayarini guncellemesi - API
  // anahtariyla kimlik dogrulanmis bir istek uzerinden cagrilir.
  // Platform politikasindaki alanlari YAZMAYA CALISSA bile, bir
  // sonraki getEffectiveSettings cagrisinda ZATEN platform tarafindan
  // ezilecegi icin PRATIKTE hicbir etkisi olmaz - ama ISTEGE BAGLI
  // olarak, burada da ACIKCA reddedilebilir (daha net bir hata mesaji
  // icin).
  async updateTenantSettings(
    tenantId: string,
    newSettings: Partial<TenantSettings>
  ): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const merged = { ...(tenant?.settings as object), ...newSettings };
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: merged },
    });
  }
}
