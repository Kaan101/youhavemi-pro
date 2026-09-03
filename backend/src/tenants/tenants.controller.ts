import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { AdminGuard } from "./admin.guard";

// Kullanici istegi: yeni bir kiraci (musteri) olusturma - SADECE
// platform admin'i (biz) yapabilir, ADMIN_SECRET ile korunur.
@UseGuards(AdminGuard)
@Controller("admin/tenants")
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Post()
  async create(@Body() dto: { name: string }) {
    // Kullanici istegi: API anahtari SADECE BU CEVAPTA duz metin
    // olarak donulur - bir daha GORUNTULENEMEZ, kiracinin bunu GUVENLI
        // bir yerde saklamasi gerekir.
    return this.service.createTenant(dto.name);
  }
}
