// Hand-curated TypeScript type definitions for @freitag/contracts.
// Mirrors schemas/**/*.json. Drift is caught by tests/round-trip.test.ts.
//
// When you add or change a schema:
// 1. Edit schemas/**/*.json
// 2. Update the matching type below
// 3. Update gen/typescript/zod/index.ts
// 4. Add a fixture in tests/fixtures/*.json
// 5. Run `npm test` — must pass

// ============================================================================
// Enums
// ============================================================================

export const AuftragsstatusValues = [
  "offen",
  "geplant",
  "in_arbeit",
  "abgeschlossen",
] as const;
export type Auftragsstatus = (typeof AuftragsstatusValues)[number];

export const SynchronisationsstatusValues = [
  "lokal",
  "in_uebertragung",
  "synchronisiert",
  "konflikt",
  "fehlgeschlagen",
] as const;
export type Synchronisationsstatus =
  (typeof SynchronisationsstatusValues)[number];

export const DokumentationsstatusValues = [
  "unvollstaendig",
  "in_pruefung",
  "vollstaendig",
  "abgelehnt",
] as const;
export type Dokumentationsstatus = (typeof DokumentationsstatusValues)[number];

// ============================================================================
// Entities
// ============================================================================

export interface Monteur {
  id: string;
  name: string;
  email: string;
  telefon?: string | null;
  passwortHash?: string | null;
  aktiv: boolean;
  erstelltAm?: string;
}

export interface Auftrag {
  id: string;
  idfNr?: string | null;
  adresse: string;
  lat?: number | string | null;
  lon?: number | string | null;
  zaehlerNummer?: string | null;
  kundenname?: string | null;
  zaehlpunktbezeichnung?: string | null;
  zaehlerstandort?: string | null;
  sperrzeitraumVon?: string | null;
  sperrzeitraumBis?: string | null;
  status: Auftragsstatus;
  monteurId?: string | null;
  wechseldatum?: string | null;
  wechseldatumPlan?: string | null;
  wechselzeitVon?: string | null;
  wechselzeitBis?: string | null;
  kalenderwoche?: number | null;
  erstelltAm?: string | null;
}

export type WochenplanTag =
  | "Montag"
  | "Dienstag"
  | "Mittwoch"
  | "Donnerstag"
  | "Freitag";

export type WochenplanStatus =
  | "geplant"
  | "aktiv"
  | "pausiert"
  | "abgeschlossen";

export interface Wochenplan {
  id: string;
  monteurId: string;
  monteurName?: string | null;
  kalenderwoche: number;
  jahr: number;
  tag: WochenplanTag;
  wechseldatum?: string | null;
  auftragIds: string[];
  streckenKm?: number | string | null;
  zeitMin?: number | null;
  routeGeojson?: string | null;
  status?: WochenplanStatus | null;
  gestartetAm?: string | null;
  beendetAm?: string | null;
  pausiertAm?: string | null;
  erstelltAm?: string | null;
}

export interface Aushang {
  id: string;
  adresse: string;
  kalenderwoche: number;
  jahr: number;
  auftragIds: string[];
  erstelltAm: string;
  bestaetigt?: boolean;
  bestaetigtAm?: string | null;
  bestaetigtVonMonteurId?: string | null;
  pdfPath?: string | null;
}

export interface ZaehlerwechselAblesung {
  zaehlerNr?: string | null;
  geraeteTyp?: string | null;
  ablesungHT?: string | null;
  ablesungNT?: string | null;
  ablesungBezug?: string | null;
}

export interface ZaehlerwechselNeuerZaehler {
  zaehlerNr?: string | null;
  geraeteTyp?: string | null;
  anfangsstandHT?: string | null;
  anfangsstandNT?: string | null;
}

export interface ZaehlerwechselAnfahrt {
  zeitpunkt: string;
  zugangErfolgreich?: boolean;
  keinZugangGrund?: string | null;
  fotoPfade?: string[];
}

export interface Zaehlerwechsel {
  id: string;
  auftragId: string;
  idfNr?: string | null;
  monteurId: string;
  monteurName?: string | null;
  alterZaehler?: ZaehlerwechselAblesung | null;
  neuerZaehler?: ZaehlerwechselNeuerZaehler | null;
  anfahrten?: ZaehlerwechselAnfahrt[];
  zaehlerFotoPfad?: string | null;
  neueZaehlerFotoPfade?: string[];
  unterschriftPfad?: string | null;
  bemerkung?: string | null;
  abgeschlossenAm: string;
  dokumentationsStatus?: Dokumentationsstatus;
  synchronisationsStatus?: Synchronisationsstatus;
  synchronisiertAm?: string | null;
}
