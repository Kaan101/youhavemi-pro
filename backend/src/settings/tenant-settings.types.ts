// Kullanici istegi: her kiracinin serbestce sectigi, ama platform
// politikasi tarafindan EZILEBILECEK parametrik ayarlar. Yeni bir
// ayar eklendiginde SADECE bu dosya ve varsayilan degerler
// guncellenir - veritabani semasi (Json kolon) DEGISMEZ.
export interface TenantSettings {
  // Katilimci kimligi nasil dogrulanacak/temsil edilecek.
  // "phone": telefon numarasi ZORUNLU (YouHaveMi'nin klasik modeli).
  // "external_id": kiracinin kendi kullanici ID'si YETERLI, telefon istenmez.
  // "both": ikisi de kabul edilir, en az biri zorunlu.
  identityMode: "phone" | "external_id" | "both";

  // Bir konusmada hangi taraf(lar) anonim kalabilir.
  // "sender": sadece gonderen anonim kalabilir (klasik YouHaveMi modeli).
  // "both": her iki taraf da anonim kalabilir.
  // "none": anonimlik yok, kimlikler acik.
  anonymitySide: "sender" | "both" | "none";

  // Mesajlarin kac gun sonra otomatik silinecegi. null = süresiz.
  messageRetentionDays: number | null;

  // Toksik icerik denetiminin (guardrail) bu kiraci icin acik olup olmadigi.
  guardrailEnabled: boolean;

  // Bir kullanicinin gunde gonderebilecegi azami mesaj sayisi. null = sinirsiz.
  dailyMessageLimit: number | null;
}

// Kullanici istegi: bir kiraci HENUZ hicbir ayar belirlemediyse
// (settings: {}) kullanilacak varsayilanlar - GUVENLI/MUHAFAZAKAR
// tarafta kalir (orn. guardrail acik, kimlik telefon zorunlu).
export const DEFAULT_TENANT_SETTINGS: TenantSettings = {
  identityMode: "phone",
  anonymitySide: "sender",
  messageRetentionDays: null,
  guardrailEnabled: true,
  dailyMessageLimit: null,
};

// Kullanici istegi: PlatformPolicy.overrides icin - HER alan
// OPSIYONEL, sadece platform tarafindan ZORLANMAK ISTENEN alanlar
// doldurulur (orn. sadece guardrailEnabled: true yazip digerlerini
// bos birakmak, "sadece guardrail'i herkese zorunlu kil, gerisini
// kiracilara birak" anlamina gelir).
export type PlatformPolicyOverrides = Partial<TenantSettings>;
