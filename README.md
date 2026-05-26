# @freitag/contracts

Shared domain contracts for the Freitag Elektrobau testline. JSON Schema as single source of truth, code-generated to TypeScript (Zod) and C# (Records).

## Repository Layout

```
schemas/
  entities/         JSON Schema definitions for domain entities (Auftrag, Monteur, ...)
  enums/            JSON Schema definitions for shared enums (Auftragsstatus, ...)
gen/
  typescript/
    types/          TypeScript type definitions (hand-curated, mirrors JSON Schema)
    zod/            Zod runtime validators (hand-curated, mirrors JSON Schema)
  csharp/           C# records generated via NJsonSchema (do not edit by hand)
tests/
  round-trip.test.ts  Drift detector: ajv (schema-of-truth) vs Zod must agree on every fixture
.changeset/         Changesets workflow for semver releases
.github/workflows/  CI for tests + codegen + publish
```

## Why hand-curated Zod?

`json-schema-to-zod` is EOL since March 2026 (see PROJECT.md research/SUMMARY.md §2). Zod schemas are hand-written in `gen/typescript/zod/` parallel to the JSON Schemas. The Vitest round-trip test catches any drift between the two sources.

## Why NJsonSchema for C#?

NJsonSchema 11.6.1 covers Draft 2020-12, generates idiomatic records, and supports `discriminator` for polymorphism (see [issue #1666](https://github.com/RicoSuter/NJsonSchema/issues/1666) for the string-only discriminator caveat).

## Consumer setup

Three downstream repos consume this package:

| Repo | Manager | Install |
|------|---------|---------|
| `freitag-webapp` | npm | `npm install @freitag/contracts` |
| `disposition-web-app` | NuGet | `dotnet add package Freitag.Contracts` |
| `serviceportal-zaehlerwechsel` | npm | `npm install @freitag/contracts` |

Authentication uses `GITHUB_TOKEN` in CI; for local dev see `docs/setup.md` (TBD).

## Workflow conventions

- Branch: `Test` (capital T)
- Commits: Conventional Commits (`feat:`, `fix:`, ...)
- Schema changes go through Expand-Contract:
  1. Add new optional field/value → ship → consumers adopt
  2. Mark old field deprecated for ≥1 release
  3. Remove deprecated field in next major

See `.planning/CONVENTIONS.md` in the workspace root for full ruleset.
