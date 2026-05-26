// Round-Trip Contract Test (Phase 1 Plan 01-02 / CONT-02)
//
// This test detects drift between the JSON Schema source of truth (validated by ajv)
// and the hand-curated Zod schemas. For every fixture, ajv and Zod must agree.
//
// Why Ajv2020 (not Ajv): JSON Schema Draft 2020-12 keywords are silently ignored by
// the default Ajv export. See research/STACK.md and the round-trip-test caveat.

import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCHEMAS_DIR = join(__dirname, "..", "schemas");
const FIXTURES_DIR = join(__dirname, "fixtures");

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

type Fixture = {
  schemaId: string;
  payload: unknown;
  shouldPass: boolean;
};

function loadFixtures(): Fixture[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(FIXTURES_DIR);
  } catch {
    return [];
  }
  return entries
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const raw = JSON.parse(readFileSync(join(FIXTURES_DIR, f), "utf-8")) as {
        schema: string;
        valid: unknown[];
        invalid: unknown[];
      };
      const valid = (raw.valid ?? []).map((payload) => ({
        schemaId: raw.schema,
        payload,
        shouldPass: true,
      }));
      const invalid = (raw.invalid ?? []).map((payload) => ({
        schemaId: raw.schema,
        payload,
        shouldPass: false,
      }));
      return [...valid, ...invalid];
    })
    .flat();
}

function loadJsonSchemas(): Map<string, object> {
  const map = new Map<string, object>();
  function walk(dir: string): void {
    let entries: string[] = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true }).map((e) =>
        e.isDirectory() ? join(dir, e.name) + "/" : join(dir, e.name)
      );
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.endsWith("/")) {
        walk(entry.slice(0, -1));
      } else if (entry.endsWith(".json")) {
        const content = JSON.parse(readFileSync(entry, "utf-8")) as {
          $id?: string;
        };
        if (content.$id) {
          map.set(content.$id, content);
        }
      }
    }
  }
  walk(SCHEMAS_DIR);
  return map;
}

// Zod registry — populated by gen/typescript/zod when it exists.
// Tests run against this map. Drift between JSON Schema and Zod fails the test.
let zodRegistry: Record<string, z.ZodTypeAny> = {};
try {
  // Dynamic import deferred until module loads to keep the test green when
  // zod registry doesn't exist yet (TDD RED state of Plan 01-02).
  const mod = await import("../gen/typescript/zod/index.js").catch(() => null);
  if (mod && typeof mod === "object" && "registry" in mod) {
    zodRegistry = mod.registry as Record<string, z.ZodTypeAny>;
  }
} catch {
  // expected during TDD RED phase
}

const fixtures = loadFixtures();
const jsonSchemas = loadJsonSchemas();

// Register every schema by $id so cross-schema $ref resolves
// (e.g. Auftrag.status references Auftragsstatus).
for (const [id, schema] of jsonSchemas) {
  if (!ajv.getSchema(id)) {
    ajv.addSchema(schema as object, id);
  }
}

describe("Round-Trip Contract Test (ajv ↔ zod)", () => {
  it("has at least one JSON schema loaded", () => {
    // TDD RED expectation: this fails until Plan 01-03 adds the first schema.
    expect(jsonSchemas.size).toBeGreaterThan(0);
  });

  it("has at least one fixture", () => {
    // TDD RED expectation: this fails until Plan 01-03 adds the first fixture.
    expect(fixtures.length).toBeGreaterThan(0);
  });

  it("has a Zod registry that matches all JSON schemas", () => {
    // TDD RED expectation: this fails until Plan 01-03 adds the first zod schema.
    for (const id of jsonSchemas.keys()) {
      expect(zodRegistry, `Missing Zod schema for ${id}`).toHaveProperty(id);
    }
  });

  for (const fx of fixtures) {
    const label = `${fx.schemaId} — ${fx.shouldPass ? "valid" : "invalid"} fixture #${fixtures.indexOf(fx)}`;
    it(label, () => {
      const jsonSchema = jsonSchemas.get(fx.schemaId);
      const zodSchema = zodRegistry[fx.schemaId];

      expect(jsonSchema, `JSON schema ${fx.schemaId} not found`).toBeDefined();
      expect(zodSchema, `Zod schema ${fx.schemaId} not found`).toBeDefined();

      // Use the pre-registered schema by $id so $ref resolution works.
      const ajvValidate = ajv.getSchema(fx.schemaId);
      expect(ajvValidate, `ajv schema ${fx.schemaId} not compiled`).toBeDefined();
      const ajvOk = ajvValidate!(fx.payload);

      const zodResult = zodSchema!.safeParse(fx.payload);
      const zodOk = zodResult.success;

      expect(
        ajvOk,
        `ajv: expected ${fx.shouldPass ? "valid" : "invalid"}, got errors: ${JSON.stringify(ajvValidate!.errors)}`
      ).toBe(fx.shouldPass);

      expect(
        zodOk,
        `zod: expected ${fx.shouldPass ? "valid" : "invalid"}, got errors: ${JSON.stringify(zodResult.success ? null : zodResult.error.format())}`
      ).toBe(fx.shouldPass);

      // Drift detection: ajv and Zod must agree on the verdict.
      expect(
        ajvOk,
        `Drift detected on ${fx.schemaId}: ajv=${ajvOk} zod=${zodOk}`
      ).toBe(zodOk);
    });
  }
});
