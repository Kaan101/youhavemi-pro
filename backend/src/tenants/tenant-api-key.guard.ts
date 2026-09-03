import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { TenantsService } from "./tenants.service";

// Kullanici istegi: kiracidan gelen HER istek, "X-Api-Key" header'i
// ile kimlik dogrulanir - bu, kullanicinin kendi JWT girisinden
// TAMAMEN AYRI, sunucu-sunucu (server-to-server) bir dogrulama.
@Injectable()
export class TenantApiKeyGuard implements CanActivate {
  constructor(private readonly tenants: TenantsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers["x-api-key"] as string | undefined;
    if (!apiKey) {
      throw new UnauthorizedException("X-Api-Key header'ı gerekli.");
    }
    const tenant = await this.tenants.validateApiKey(apiKey);
    (request as any).tenant = tenant;
    return true;
  }
}
