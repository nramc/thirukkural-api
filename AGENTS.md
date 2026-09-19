# AGENTS.md

## Project shape

- This is a Next.js 16 App Router project using strict TypeScript, React 19, Tailwind CSS v4, and Vercel-friendly route
  handlers.
- `app/api/` is the HTTP boundary; `app/service/` owns Kural lookup, search, daily selection, and random selection;
  `app/domain/kurals-db.ts` defines the data contract; shared UI and AI elements are under root-level `components/`.
- Canonical Tamil Kurals are stored in `public/data/canonical/kurals.ta.json`; transliteration, taxonomy, manifests, and
  interpretations are stored in their respective data files/directories and composed by the service loader.
- `public/openapi/openapi.yaml` and `public/openapi/swagger-ui.html` are the API documentation assets. The OpenAPI file
  currently covers core Kural endpoints, while chat is described in `README.md` and the route source. Keep the OpenAPI
  file and `README.md` aligned with externally visible API changes.

## Data and API flow

- A `Kural` has `number`, localized `section` and `chapter` references, two-element `kural` and `transliteration`
  arrays, and a `meaning` object with the current required keys `ta_mu_va`, `ta_salamon`, `ta_kalaignar`, `en`, and
  `en_modern`. Meaning requirements are derived from `public/data/manifests/*.json`; `en_modern` is a plain-language
  interpretation, not a literal translation.
- `GET /api/kural/{id}` delegates to `kuralService.search()` and returns JSON or a 404. Valid Kural numbers are 1–1330.
  The current dynamic route only rejects a missing id and uses `Number.parseInt`, so its path validation is not strict
  lexical validation of an integer.
- `GET /api/kural?q=...&page=...&limit=...&section=...&chapter=...` delegates to `searchByKeyword()`. Comma-separated
  keywords use OR matching across couplet lines, transliterations, and all meanings; the route passes the comma-split
  values through without trimming or case normalization, and the response is `{ results, total, page, limit }`.
  `chapter` takes precedence over `section` here as well as in random selection.
- `GET /api/daily` uses the date-derived ID from `DailyKuralService`; `GET /api/random` uses `RandomKuralService`. For
  random requests, `chapter` takes precedence over `section`; ranges are chapters 1–133 and sections 1–3 (`1–380`,
  `381–1080`, `1081–1330`).
- Keep route handlers thin: parse/validate boundary inputs, call the relevant singleton service, and return the nearby
  route’s `Response.json()`/`NextResponse.json()` shape. Do not load data files directly in a route.

## AI integration

- `/chat` is a client page using `useChat()` and `DefaultChatTransport` to post to `POST /api/chat`; reusable chat UI is
  under root-level `components/ai-elements/`.
- `/api/chat` explicitly uses the Node.js runtime. It normalizes messages, requires a user-first conversation, keeps recent
  turns within a message-count and character budget, enables the Kural tools in `lib/ai/chat-tools.ts`, and supports UI-message, plain-text, and
  non-streaming JSON responses.
- `lib/ai/model-resolver.ts` supports `ollama` (via `@ai-sdk/openai`, `OLLAMA_BASE_URL/v1`, placeholder key `ollama`)
  and `openrouter` (via `@openrouter/ai-sdk-provider`, server-only `LLM_API_KEY`). `LLM_MODEL` is required;
  `LLM_ALLOWED_MODELS` is an optional comma-separated allowlist; `OPENROUTER_SITE_URL` and `OPENROUTER_APP_NAME`
  become OpenRouter headers. `OPENROUTER_REASONING` (default off) and `OPENROUTER_PROVIDER_SORT` (default
  `throughput`) tune OpenRouter latency and routing. `OPENROUTER_REQUIRE_PARAMETERS` defaults to `true` so tool
  requests use compatible providers; `OPENROUTER_QUANTIZATIONS` and `OPENROUTER_IGNORE_PROVIDERS` are optional
  comma-separated filters. Keep `LLM_MODEL` on `openrouter/free` or an explicit `:free` model ID when paid models are
  not allowed. Provider filters can reduce free-route availability, so change them only after checking OpenRouter
  metadata and keep `OPENROUTER_REQUIRE_PARAMETERS=false` as the emergency rollback if no eligible route remains.
- Preserve chat limits and safeguards: at most 100 incoming messages, 12,000 characters per message, 120,000 total
  characters, up to 24 recent messages bounded by a 16,000-character budget (`MAX_CONTEXT_MESSAGES` /
  `MAX_CONTEXT_CHARACTERS` in `lib/ai/chat-policy.ts`), 1,024 output tokens, and four tool/model steps. Keep request
  IDs, a combined request/45s-timeout abort signal, generic client errors, and metadata-only tool logging. OpenRouter
  usage accounting is enabled in `lib/ai/model-resolver.ts`; `POST /api/chat` logs aggregated completion usage from
  `onEnd` and per-step usage/provider metadata from `onStepEnd` for both streaming and non-streaming requests.
  Sanitize provider metadata to an explicit allowlist of provider, token, cost, finish, step, and duration fields; never
  log prompts, model output, reasoning details, tool arguments/results, or secrets, and never return provider metadata
  to clients.
- `lib/ai/chat-tools.ts` also exposes batch tools `getRandomKurals` (with `excludeIds`) and `getKuralsByIds` so
  quiz-style sessions can avoid one tool call per Kural; the system prompt instructs the model to prefer them and to
  track a running score in-band.
- `/quiz` is a separate, deterministic client page (no LLM calls) that fetches distinct Kurals via `/api/random` and
  self-grades a multiple-choice round; use it as the fast alternative to AI-driven quizzing in `/chat`.

## Local workflow and conventions

- Use Node `24.21.0` from `package.json`, npm, four-space indentation, single quotes, semicolons, trailing commas, and
  Prettier’s 160-column width. Use `@/*` for root imports.
- Common commands: `npm install`, `npm run dev`, `npm run build && npm run start`, `npm run format:check`,
  `npm run lint`, `npm run typecheck`, `npm run validate:data`, and `npm run security:check`.
- `npm run validate:data` is the independent data-integrity check for the three sections, 133 chapters, 1,330 canonical
  Kurals, transliterations, manifests, taxonomy ranges, and interpretation coverage. Runtime services load `public/data`
  during module initialization, so restart the process after data-file changes.
- `npm test` is intentionally a placeholder that exits 1 because no test suite is wired in; consequently
  `npm run verify` also reaches that expected failure. `verify` does not run the production build or data validation.
  Use `npm run prepare:commit` when appropriate, remembering that it runs lint/format fixes before typecheck and build.
- `components/daily-kural-widget.tsx` is the client component that fetches `/api/daily` in `useEffect` and renders
  explicit loading/error states. Keep secrets out of client code: never expose `LLM_API_KEY` through `NEXT_PUBLIC_*`
  variables or logs.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` enables consent-gated Google Analytics through `components/analytics-consent.tsx`;
  `NEXT_PUBLIC_SITE_URL` controls canonical metadata, robots, and sitemap URLs. `next.config.ts` applies wildcard CORS
  headers to `/api/:path*`, so CORS changes are security-sensitive.
- Do not commit `.env.local`, credentials, certificates, build output, or unrelated formatting. Changes to validation,
  dependencies, logging, or AI providers are security-sensitive.
