// Kullanici istegi: kiraci, katilimciyi telefon numarasi VEYA kendi
// dis kimligiyle (externalId) tanimlayabilir - identityMode ayarina
// gore hangisinin ZORUNLU oldugu degisir.
export interface ParticipantIdentifier {
  phoneNumber?: string;
  externalId?: string;
}
