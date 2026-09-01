# AGENTS.md

## Project shape

- This is a Next.js 16 App Router project using strict TypeScript, React 19, Tailwind CSS v4, and Vercel-friendly route handlers.
- `app/api/` is the HTTP boundary; `app/service/` owns Kural lookup, search, daily selection, and random selection; `app/domain/kurals-db.ts` defines the data contract.
- `public/data/kurals.json` is the source of all 1,330 Kurals. `KuralService` reads it from `path.resolve('public/data/kurals.json')` once when its singleton is initialized, so preserve the repository-root working-directory assumption.
- `public/openapi/openapi.yaml` and `public/openapi/swagger-ui.html` are the API documentation assets. Keep the OpenAPI file and `README.md` aligned with externally visible API changes.

## Data and API flow

- A `Kural` has `number`, Tamil `section` and `chapter`, a two-element `kural` array, and a `meaning` map containing `ta_mu_va`, `ta_salamon`, `ta_kalaignar`, and `en`.
- `GET /api/kural/{id}` delegates to `kuralService.search()` and returns JSON or a 404. Valid Kural numbers are 1–1330.
- `GET /api/kural?q=...&page=...&limit=...` delegates to `searchByKeyword()`. Comma-separated keywords use OR matching across both couplet lines and all meanings; the response is `{ results, total, page, limit }`.
- `GET /api/daily` uses the date-derived ID from `DailyKuralService`; `GET /api/random` uses `RandomKuralService`. For random requests, `chapter` takes precedence over `section`; ranges are chapters 1–133 and sections 1–3 (`1–380`, `381–1080`, `1081–1330`).
- Keep route handlers thin: parse/validate boundary inputs, call the relevant singleton service, and return the nearby route’s `Response.json()`/`NextResponse.json()` shape. Do not load `kurals.json` directly in a route.

## AI integration

- `/chat` is a client page using `useChat()` and `DefaultChatTransport` to post to `POST /api/chat`; reusable chat UI is under `components/ai-elements/`.
- `/api/chat` explicitly uses the Node.js runtime. It normalizes messages, requires a user-first conversation, keeps the five newest messages, enables the Kural tools in `lib/ai/chat-tools.ts`, and supports UI-message, plain-text, and non-streaming JSON responses.
- `lib/ai/model-resolver.ts` supports `ollama` (`OLLAMA_BASE_URL/v1`, placeholder key `ollama`) and OpenRouter (`https://openrouter.ai/api/v1`, server-only `LLM_API_KEY`). `LLM_MODEL` is required; `LLM_ALLOWED_MODELS` is an optional comma-separated allowlist.
- Preserve chat limits and safeguards: at most 100 incoming messages, 12,000 characters per message, 120,000 total characters, five context messages, 1,024 output tokens, and five tool/model steps. Keep request IDs, abort handling, generic client errors, and metadata-only tool logging.

## Local workflow and conventions

- Use Node `24.20.0` from `package.json`, npm, four-space indentation, single quotes, semicolons, trailing commas, and Prettier’s 160-column width. Use `@/*` for root imports.
- Common commands: `npm install`, `npm run dev`, `npm run build && npm run start`, `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run security:check`.
- `npm test` is intentionally a placeholder that exits 1 because no test suite is wired in; consequently `npm run verify` also reaches that expected failure. Use `npm run prepare:commit` for the project’s housekeeping plus build check when appropriate.
- Client pages such as `app/page.tsx` fetch API data in `useEffect` and render explicit loading/error states. Keep secrets out of client code: never expose `LLM_API_KEY` through `NEXT_PUBLIC_*` variables or logs.
- Do not commit `.env.local`, credentials, certificates, build output, or unrelated formatting. Changes to CORS, validation, dependencies, logging, or AI providers are security-sensitive.
