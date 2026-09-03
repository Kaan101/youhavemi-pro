import { Injectable } from "@nestjs/common";

// Kullanici istegi: kiracinin guardrailEnabled ayari acikken, GONDERILECEK
// mesaji ANLIK olarak degerlendiren BASIT bir kelime listesi kontrolu -
// YouHaveMi'nin orijinal projesindeki gibi, "basit basla, ustune katman
// ekle" yaklasimi. Kelime listesi ilerleyen surumlerde veritabanindan
// (kiraciya OZEL olarak da) yonetilebilir hale getirilebilir.
const BASIC_TOXIC_WORDS = ["küfür1", "hakaret1", "tehdit1"]; // Ornek - gercek liste ile degistirilmeli.

export interface GuardrailResult {
  isToxic: boolean;
  matchedWords: string[];
}

@Injectable()
export class GuardrailService {
  evaluate(body: string): GuardrailResult {
    const lower = body.toLocaleLowerCase("tr-TR");
    const matched = BASIC_TOXIC_WORDS.filter((word) => lower.includes(word));
    return { isToxic: matched.length > 0, matchedWords: matched };
  }
}
