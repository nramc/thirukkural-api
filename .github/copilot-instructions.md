# Copilot instructions for Thirukkural API

## Project context

- This is a Next.js App Router application using TypeScript, React, and serverless-friendly route handlers.
- The project exposes a REST API for 1,330 Thirukkural couplets and includes a web UI plus an optional AI chat
  experience.
- Kural data is stored in `public/data/kurals.json`; related chapter and section data is in the same directory.
- Use the `@/*` path alias for repository-root imports when it matches the surrounding code.
- Keep the existing four-space indentation, single-quote style, ESLint rules, and Prettier formatting.

## Important directories

- `app/api/` — API route handlers for Kural lookup, search, daily/random Kurals, diagnostics, and chat.
- `app/service/` — Kural data access, search, daily selection, and random selection logic.
- `app/domain/` — domain types and the Kural data contract.
- `lib/ai/` — model resolution, chat policy, and Kural lookup tools.
- `app/components/` and `components/` — reusable UI components.
- `public/openapi/` — OpenAPI specification and Swagger UI.

## Development commands

Use npm and the Node.js version declared in `package.json` (`24.20.0`):

```bash
npm install
npm run dev
npm run format:check
npm run lint
npm run typecheck
npm run security:check
npm run build
npm run prepare:commit
```

Run `npm run verify` before a pull request when practical. Note that `npm test` is currently a placeholder that exits
with status 1 because an automated test suite has not been wired in yet; do not treat that as a newly introduced failure
without checking the script.

## Implementation rules

- Prefer small, focused changes and preserve existing public APIs and response shapes.
- Use App Router route-handler conventions and delegate business logic to the existing service layer rather than loading
  data directly in route handlers.
- Preserve the `Kural` contract: number, section, chapter, two-line `kural` array, and the five meaning fields
  (`ta_mu_va`, `ta_salamon`, `ta_kalaignar`, `en`, and `en_modern`). Treat `en_modern` as a clearly labeled modern
  interpretation, not a literal translation.
- Validate path and query parameters at API boundaries, return JSON with an appropriate HTTP status, and keep error
  responses consistent with nearby handlers.
- Preserve the documented range and precedence rules: Kural IDs are 1–1330; sections are 1–3; chapter filtering takes
  precedence over section filtering.
- When changing endpoint behavior, schemas, or examples, update both `README.md` and `public/openapi/openapi.yaml` where
  applicable.
- Verify the implementation with `npm run prepare:commit` before providing status updates.

## AI and privacy rules

- Keep `LLM_API_KEY` server-only. Never move secrets into `NEXT_PUBLIC_*` variables or client components.
- Preserve the existing provider validation, optional model allowlist, message-size limits, context trimming, output
  limits, abort handling, request IDs, and generic client-facing errors.
- Treat user messages, model output, and tool results as untrusted input. Do not weaken prompt-injection protections or
  allow fabricated Kural text to be presented as verified source material.
- Do not log prompts, message bodies, API keys, full tool payloads, or full model output. Keep operational logs limited
  to safe metadata.
- Add or update tests when changing chat policy, model resolution, tool schemas, validation, or error handling.

## Security and dependency rules

- Never commit `.env.local`, API keys, certificates, generated build output, or other credentials.
- Treat changes to CORS, logging, route validation, authentication, dependencies, and AI providers as
  security-sensitive.
- Do not copy or expand the insecure TLS behavior in `.npmrc` (`strict-ssl=false`) into new tooling or environments.
- Prefer the smallest dependency change possible and run `npm run security:check` after dependency updates.

## Completion checklist

Before considering a change complete:

1. Confirm the implementation follows nearby patterns and preserves existing response contracts.
2. Update documentation for externally visible behavior.
3. Run the relevant formatter, lint, typecheck, build, and security checks.
4. Review the diff for secrets, unrelated formatting, and accidental generated files.
