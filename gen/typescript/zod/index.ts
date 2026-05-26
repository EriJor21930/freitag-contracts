// Hand-curated Zod schemas for @freitag/contracts.
// Mirrors schemas/**/*.json. The round-trip test (tests/round-trip.test.ts)
// validates that ajv (truth) and Zod agree on every fixture.
//
// Field-by-field correspondence with gen/typescript/types/index.ts.

import { z } from "zod";
import {
  AuftragsstatusValues,
  DokumentationsstatusValues,
  SynchronisationsstatusValues,
} from "../types/index.js";

// ============================================================================
// Enums
// ============================================================================

export const AuftragsstatusSchema = z.enum(AuftragsstatusValues);
export const SynchronisationsstatusSchema = z.enum(
  SynchronisationsstatusValues,
);
export const DokumentationsstatusSchema = z.enum(DokumentationsstatusValues);

// ============================================================================
// Helpers
// ============================================================================

// JSON Schema "string | null" with optional field → matches both `null` and
// `undefined` (omitted), so accept both via `.optional().nullable()`. Where the
// JSON Schema marks the field as required but type=["string","null"], use
// `.nullable()` only.
const isoDateTime = z.string(); // not enforcing format here — schema-level catches drift
const isoDate = z.string();
const numberOrDecimalString = z.union([z.number(), z.string()]);

// ============================================================================
// Entities
// ============================================================================

export const MonteurSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1),
    email: z.string().email(),
    telefon: z.string().nullable().optional(),
    passwortHash: z.string().nullable().optional(),
    aktiv: z.boolean(),
    erstelltAm: isoDateTime.optional(),
  })
  .strict();

export const AuftragSchema = z
  .object({
    id: z.string(),
    idfNr: z.string().nullable().optional(),
    adresse: z.string().min(1),
    lat: numberOrDecimalString.nullable().optional(),
    lon: numberOrDecimalString.nullable().optional(),
    zaehlerNummer: z.string().nullable().optional(),
    kundenname: z.string().nullable().optional(),
    zaehlpunktbezeichnung: z.string().nullable().optional(),
    zaehlerstandort: z.string().nullable().optional(),
    sperrzeitraumVon: isoDate.nullable().optional(),
    sperrzeitraumBis: isoDate.nullable().optional(),
    status: AuftragsstatusSchema,
    monteurId: z.string().nullable().optional(),
    wechseldatum: isoDate.nullable().optional(),
    wechseldatumPlan: isoDate.nullable().optional(),
    wechselzeitVon: z.string().nullable().optional(),
    wechselzeitBis: z.string().nullable().optional(),
    kalenderwoche: z.number().int().min(1).max(53).nullable().optional(),
    erstelltAm: isoDateTime.nullable().optional(),
  })
  .strict();

const WochenplanTagSchema = z.enum([
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
]);

const WochenplanStatusSchema = z.enum([
  "geplant",
  "aktiv",
  "pausiert",
  "abgeschlossen",
]);

export const WochenplanSchema = z
  .object({
    id: z.string(),
    monteurId: z.string(),
    monteurName: z.string().nullable().optional(),
    kalenderwoche: z.number().int().min(1).max(53),
    jahr: z.number().int().min(2024).max(2100),
    tag: WochenplanTagSchema,
    wechseldatum: isoDate.nullable().optional(),
    auftragIds: z.array(z.string()),
    streckenKm: numberOrDecimalString.nullable().optional(),
    zeitMin: z.number().int().nullable().optional(),
    routeGeojson: z.string().nullable().optional(),
    status: WochenplanStatusSchema.nullable().optional(),
    gestartetAm: isoDateTime.nullable().optional(),
    beendetAm: isoDateTime.nullable().optional(),
    pausiertAm: isoDateTime.nullable().optional(),
    erstelltAm: isoDateTime.nullable().optional(),
  })
  .strict();

export const AushangSchema = z
  .object({
    id: z.string(),
    adresse: z.string().min(1),
    kalenderwoche: z.number().int().min(1).max(53),
    jahr: z.number().int().min(2024).max(2100),
    auftragIds: z.array(z.string()).min(2),
    erstelltAm: isoDateTime,
    bestaetigt: z.boolean().optional(),
    bestaetigtAm: isoDateTime.nullable().optional(),
    bestaetigtVonMonteurId: z.string().nullable().optional(),
    pdfPath: z.string().nullable().optional(),
  })
  .strict();

const AblesungSchema = z
  .object({
    zaehlerNr: z.string().nullable().optional(),
    geraeteTyp: z.string().nullable().optional(),
    ablesungHT: z.string().nullable().optional(),
    ablesungNT: z.string().nullable().optional(),
    ablesungBezug: z.string().nullable().optional(),
  })
  .strict();

const NeuerZaehlerSchema = z
  .object({
    zaehlerNr: z.string().nullable().optional(),
    geraeteTyp: z.string().nullable().optional(),
    anfangsstandHT: z.string().nullable().optional(),
    anfangsstandNT: z.string().nullable().optional(),
  })
  .strict();

const AnfahrtSchema = z
  .object({
    zeitpunkt: isoDateTime,
    zugangErfolgreich: z.boolean().optional(),
    keinZugangGrund: z.string().nullable().optional(),
    fotoPfade: z.array(z.string()).optional(),
  })
  .strict();

export const ZaehlerwechselSchema = z
  .object({
    id: z.string(),
    auftragId: z.string(),
    idfNr: z.string().nullable().optional(),
    monteurId: z.string(),
    monteurName: z.string().nullable().optional(),
    alterZaehler: AblesungSchema.nullable().optional(),
    neuerZaehler: NeuerZaehlerSchema.nullable().optional(),
    anfahrten: z.array(AnfahrtSchema).max(3).optional(),
    zaehlerFotoPfad: z.string().nullable().optional(),
    neueZaehlerFotoPfade: z.array(z.string()).optional(),
    unterschriftPfad: z.string().nullable().optional(),
    bemerkung: z.string().nullable().optional(),
    abgeschlossenAm: isoDateTime,
    dokumentationsStatus: DokumentationsstatusSchema.optional(),
    synchronisationsStatus: SynchronisationsstatusSchema.optional(),
    synchronisiertAm: isoDateTime.nullable().optional(),
  })
  .strict();

// ============================================================================
// Registry — used by tests/round-trip.test.ts and external consumers who want
// to look up a schema by its JSON-Schema $id.
// ============================================================================

import type { ZodTypeAny } from "zod";

export const registry: Record<string, ZodTypeAny> = {
  Auftragsstatus: AuftragsstatusSchema,
  Synchronisationsstatus: SynchronisationsstatusSchema,
  Dokumentationsstatus: DokumentationsstatusSchema,
  Monteur: MonteurSchema,
  Auftrag: AuftragSchema,
  Wochenplan: WochenplanSchema,
  Aushang: AushangSchema,
  Zaehlerwechsel: ZaehlerwechselSchema,
};
