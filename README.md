<p align="center">
  <img src="./public/favicon.svg" width="120" alt="Thirukkural API logo" style="border: 1px solid #000;border-radius: 50%;" />
</p>

<h1 align="center">Thirukkural API</h1>

<p align="center">
  A developer-friendly REST API for exploring the 1,330 couplets of <em>Thirukkural</em> — with Tamil text, translations, and meanings.
</p>

<p align="center">
  <a href="https://kural.codewithram.dev">Live App</a> ·
  <a href="https://kural.codewithram.dev/openapi/swagger-ui.html">Swagger UI</a> ·
  <a href="https://kural.codewithram.dev/openapi/openapi.yaml">OpenAPI specification</a>
</p>

<p align="center">
  <a href="https://github.com/nramc/thirukkural-api"><img src="https://img.shields.io/badge/source-GitHub-181717?logo=github" alt="GitHub repository" /></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-type--safe-3178C6?logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://vercel.com/"><img src="https://img.shields.io/badge/deploy-Vercel-black?logo=vercel" alt="Deploy with Vercel" /></a>
  <a href="https://www.linkedin.com/in/ramachandran-nellaiyappan/"><img src="https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin&logoColor=white" alt="Connect on LinkedIn" /></a>
</p>

## Why this project?

Thirukkural is a classic Tamil work of 1,330 couplets covering virtue, prosperity, and love. This project makes that
wisdom easy to discover and integrate into applications through a small, serverless-friendly API and a Next.js web
experience.

### Highlights

- **Complete collection** — retrieve any Kural from 1–1330.
- **Useful discovery endpoints** — daily, random, chapter, section, and keyword search.
- **Rich responses** — Tamil couplets plus meanings by Mu. Varadarajan, Solomon Pappayya, Kalaignar, and an English
  translation.
- **AI-assisted exploration** — an optional chat experience powered by Ollama or OpenRouter.
- **OpenAPI included** — browse the interactive Swagger UI or import the specification into your favorite client.

## Quick start

### Requirements

- [Node.js](https://nodejs.org/) `24.20.0` (see `package.json`)
- npm

### Run locally

```bash
git clone https://github.com/nramc/thirukkural-api.git
cd thirukkural-api
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app. The local API is available under
`http://localhost:3000/api`.

For a production-like local run:

```bash
npm run build
npm run start
```

## API at a glance

The production API base URL is `https://kural.codewithram.dev/api`. Single-Kural, daily, and random endpoints return
this core shape:

```json
{
  "number": 1,
  "section": "அறத்துப்பால்",
  "chapter": "கடவுள் வாழ்த்து",
  "kural": [
    "அகர முதல எழுத்தெல்லாம் ஆதி",
    "பகவன் முதற்றே உலகு."
  ],
  "meaning": {
    "ta_mu_va": "...",
    "ta_salamon": "...",
    "ta_kalaignar": "...",
    "en": "As the letter A is the first of all letters, so the eternal God is first in the world."
  }
}
```

| Endpoint                                     | Description                                                                   |
|----------------------------------------------|-------------------------------------------------------------------------------|
| `GET /api/kural/{id}`                        | Get one Kural by number (`1`–`1330`).                                         |
| `GET /api/kural?q={keyword}&page=1&limit=10` | Search meanings and couplet text. `q` accepts comma-separated keywords.       |
| `GET /api/daily`                             | Get the date-based Kural of the day.                                          |
| `GET /api/random`                            | Get a random Kural.                                                           |
| `GET /api/random?section={1\|2\|3}`          | Get a random Kural from a section.                                            |
| `GET /api/random?chapter={1..133}`           | Get a random Kural from a chapter. `chapter` takes precedence over `section`. |

### Examples

```bash
# Get Kural 1
curl https://kural.codewithram.dev/api/kural/1

# Search for Kurals containing a keyword
curl 'https://kural.codewithram.dev/api/kural?q=அறம்&page=1&limit=5'

# Get a random Kural from the Virtue section
curl 'https://kural.codewithram.dev/api/random?section=1'

# Get today's Kural
curl https://kural.codewithram.dev/api/daily
```

Section ranges are `1` — அறத்துப்பால் / Virtue (`1`–`380`), `2` — பொருட்பால் / Wealth (`381`–`1080`), and `3` —
காமத்துப்பால் / Love (`1081`–`1330`).

The complete contract is available in [`public/openapi/openapi.yaml`](./public/openapi/openapi.yaml). The OpenAPI file
currently focuses on the core Kural endpoints; search and chat are documented above and in the source route handlers.

## Optional AI chat

The `/chat` page and `POST /api/chat` route support two providers:

- **Ollama** for local development
- **OpenRouter** for hosted models

Create `.env.local` (never commit credentials) and configure the provider you want. See [`.env.example`](./.env.example)
for the repository defaults.

| Variable              | Required       | Purpose                                               |
|-----------------------|----------------|-------------------------------------------------------|
| `LLM_PROVIDER`        | Yes            | `ollama` or `openrouter`.                             |
| `LLM_MODEL`           | Yes            | Model identifier to use.                              |
| `LLM_ALLOWED_MODELS`  | No             | Comma-separated allowlist for server-approved models. |
| `OLLAMA_BASE_URL`     | For Ollama     | Ollama server URL.                                    |
| `LLM_API_KEY`         | For OpenRouter | Server-only OpenRouter API key.                       |
| `OPENROUTER_SITE_URL` | No             | Optional OpenRouter HTTP referer.                     |
| `OPENROUTER_APP_NAME` | No             | Optional OpenRouter application title.                |

Example local Ollama configuration:

```dotenv
LLM_PROVIDER=ollama
LLM_MODEL=mistral
OLLAMA_BASE_URL=http://localhost:11434
LLM_ALLOWED_MODELS=mistral
```

The chat API validates messages, limits context size, and exposes Kural lookup tools so the assistant can answer with
source-backed content. Keep `LLM_API_KEY` server-side and rotate any key that may have been exposed.

## Project layout

```text
app/
├── api/                 # REST and chat route handlers
├── chat/                # AI chat page
├── domain/              # Kural data types and data access
├── service/             # Kural, daily, random, and search services
└── components/          # Shared UI components
lib/ai/                  # Model resolution, policy, and chat tools
public/data/             # Chapters, sections, and 1,330 Kurals
public/openapi/          # OpenAPI YAML and Swagger UI
```

## Developer workflow

```bash
npm run lint           # ESLint
npm run typecheck      # TypeScript project check
npm run format:check   # Prettier check
npm run security:check # High-severity npm audit check
npm run verify         # Run the full repository verification suite
```

`npm test` is currently a placeholder that exits unsuccessfully because no automated test suite has been wired in yet.
Add tests before changing that behavior.

## Deploy to Vercel

The app is designed for [Vercel](https://vercel.com/). Import the repository into a Vercel project, set the environment
variables required by the optional chat feature, and deploy. For CLI deployment:

```bash
npm install -g vercel
vercel login
vercel
```

Set `NEXT_PUBLIC_SITE_URL` to your canonical public URL when deploying a custom domain so generated metadata and robots
configuration can use it.

## Contributing

Contributions, corrections, and ideas are welcome. A typical workflow is:

1. Fork the repository and create a focused branch: `git checkout -b feature/my-improvement`.
2. Make the change and update documentation when behavior changes.
3. Run `npm run verify` (or the relevant checks while developing).
4. Open a pull request with a clear summary and testing notes.

Please do not commit `.env.local`, API keys, generated build output, or unrelated formatting changes.

## License and credits

The repository currently does not include a `LICENSE` file. Confirm the intended license with the project maintainer
before redistributing or adding a license notice.

Built with [Next.js](https://nextjs.org/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/),
and [Vercel](https://vercel.com/).

Questions or suggestions? Connect with [Ramachandran Nellaiyappan](https://github.com/nramc) or open an issue.

<p align="center">
  <img src="./public/favicon.svg" width="32" alt="Thirukkural icon" />
  <br />
  If this project helps you, consider giving it a ⭐ on GitHub.
</p>
