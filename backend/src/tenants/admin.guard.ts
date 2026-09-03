import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";

// Kullanici istegi: kiraci OLUSTURMA gibi platform-seviyesi islemler,
// BASIT bir admin anahtariyla korunur - kiracilarin kendi API
// anahtarindan TAMAMEN AYRI, sadece BIZIM (platform) erisebilecegi
// bir sifre.
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const secret = request.headers["x-admin-secret"];
    if (!secret || secret !== process.env.ADMIN_SECRET) {
      throw new UnauthorizedException("Geçersiz admin anahtarı.");
    }
    return true;
  }
}
