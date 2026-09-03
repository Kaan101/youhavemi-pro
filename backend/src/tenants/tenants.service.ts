import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../common/prisma.service";
import { generateApiKey, hashApiKey } from "./api-key.util";

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  // Kullanici istegi: gelen isteklerdeki API anahtarini dogrulayip
  // kiraciyi doner - guard bunu kullanir.
  async validateApiKey(apiKey: string) {
    const hash = hashApiKey(apiKey);
    const tenant = await this.prisma.tenant.findUnique({ where: { apiKeyHash: hash } });
    if (!tenant || !tenant.isActive) {
      throw new UnauthorizedException("Geçersiz API anahtarı.");
    }
    return tenant;
  }

  // Kullanici istegi: yeni bir kiraci (musteri) olustururken - API
  // anahtari SADECE BU ANDA duz metin olarak donulur, sonra BIR DAHA
  // GORUNTULENEMEZ (hash'i saklanir).
  async createTenant(name: string) {
    const apiKey = generateApiKey();
    const tenant = await this.prisma.tenant.create({
      data: { name, apiKeyHash: hashApiKey(apiKey) },
    });
    return { tenant, apiKey };
  }

  // Kullanici istegi: admin ekraninda TUM kiracilari listelemek icin -
  // apiKeyHash ASLA donulmez (guvenlik).
  async listTenants() {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        isActive: true,
        settings: true,
        webhookUrl: true,
        createdAt: true,
      },
    });
    return tenants;
  }
}
