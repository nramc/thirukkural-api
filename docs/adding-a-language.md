# Adding a language

This project keeps Tamil as the canonical source language. Adding a language adds localized taxonomy names and
interpretation or translation content; it does not create a second canonical Kural file.

In this guide, `fr` is the **locale code** for French, while `fr_translation` is a **meaning key** for one specific
French content source. They are intentionally different:

- `fr` identifies the language and is used in taxonomy names, manifest metadata, and interpretation directories.
- `fr_translation` identifies the particular meaning field exposed by the current flat API response.
- A language can have several meaning fields, such as `fr_translation`, `fr_modern`, and `fr_commentary`.
- Meaning keys are globally unique, so prefixing them with the locale prevents collisions between languages and makes
  their purpose clear.

Use `fr_translation` rather than `fr` for a normal French translation. A bare `fr` key could be ambiguous as soon as a
second French interpretation is added.

## Before you start

For example, to add French, choose these values and keep them consistent across all files:

| Purpose                  | French value                      |
| ------------------------ | --------------------------------- |
| Locale code              | `fr`                              |
| Language name            | `French`                          |
| Interpretation ID        | `translation`                     |
| Interpretation type      | `translation`                     |
| Meaning key              | `fr_translation`                  |
| Interpretation directory | `public/data/interpretations/fr/` |
| Manifest                 | `public/data/manifests/fr.json`   |

If you also add a modern French explanation, use a separate interpretation ID and meaning key, for example `modern` and
`fr_modern`.

For another language, replace the French-specific values with that language's locale and names. Keep the same
distinction between the locale code and each content source's meaning key.

More generally, choose:

- A stable locale code, such as `fr`, `hi`, or `de`.
- A unique meaning key for every interpretation that should be exposed by the existing API, such as `fr_translation` or
  `fr_modern`.
- A stable interpretation ID, such as `translation`, `modern`, or `commentary`.
- The provenance and review information to record in each file's `metadata` object.

Meaning keys are global across all manifests. Do not reuse `en`, `en_modern`, `ta_mu_va`, `ta_salamon`, or
`ta_kalaignar`, and do not reuse a key introduced by another language. For French, that means using `fr_translation` and
`fr_modern`, not a generic key such as `translation` or `fr`.

## 1. Add localized section names

Edit `public/data/sections.json` and add the new locale to every section's `names` object:

```json
{
    "id": 1,
    "names": {
        "ta": "அறத்துப்பால்",
        "en": "Virtue",
        "fr": "Vertu"
    },
    "firstKural": 1,
    "lastKural": 380
}
```

Keep the existing section IDs and Kural ranges unchanged. Add a non-empty name for all three sections.

## 2. Add localized chapter names

Edit `public/data/chapters.json` and add the same locale to every chapter's `names` object:

```json
{
    "id": 1,
    "sectionId": 1,
    "names": {
        "ta": "கடவுள் வாழ்த்து",
        "en": "The Praise of God",
        "fr": "La louange de Dieu"
    },
    "firstKural": 1,
    "lastKural": 10
}
```

Keep all chapter IDs, `sectionId` values, and inclusive Kural ranges unchanged. There must be a non-empty localized name
for all 133 chapters.

## 3. Create complete interpretation files

Create a directory at `public/data/interpretations/<locale>/`. Add one JSON file for each translation or interpretation.
Every file must contain all 1,330 Kurals, keyed by Kural number.

For the French example above, create `public/data/interpretations/fr/translation.json`:

```json
{
    "schemaVersion": "1.0.0",
    "locale": "fr",
    "contentType": "translation",
    "identifier": "translation",
    "displayName": "French translation",
    "coverage": {
        "total": 1330
    },
    "metadata": {
        "reviewStatus": "editorially-reviewed"
    },
    "items": {
        "1": {
            "text": "..."
        },
        "2": {
            "text": "..."
        }
    }
}
```

The validator requires the following to match the manifest exactly:

- `locale` matches the manifest locale.
- `identifier` matches the interpretation `id`.
- `contentType` matches the interpretation `type`.
- `coverage.total` is `1330`.
- `items` contains exactly the Kural numbers `1` through `1330`.
- Every `text` value is a non-empty string.
- `displayName` is a non-empty human-readable name for the content source.
- `metadata.reviewStatus` is a non-empty file-level review status.

Keep editorial metadata at file level. Add other provenance fields there as needed, but do not repeat author, source, or review metadata inside every Kural item.

## 4. Add the language manifest

For French, create `public/data/manifests/fr.json`:

```json
{
    "schemaVersion": "1.0.0",
    "locale": "fr",
    "languageName": "French",
    "canonical": "canonical/kurals.ta.json",
    "transliteration": "transliterations/ta-Latn.json",
    "requiredMeaningKeys": ["fr_translation"],
    "interpretations": [
        {
            "id": "translation",
            "type": "translation",
            "path": "interpretations/fr/translation.json",
            "meaningKey": "fr_translation"
        }
    ]
}
```

Important manifest rules:

- `locale` is required.
- Interpretation `id` values must be unique within the manifest.
- Every `path` is relative to `public/data`.
- `meaningKey` is optional for internal/search-only content, but it is required for a translation or interpretation that
  should be exposed in the API's `meaning` object.
- Every exposed `meaningKey` must appear in `requiredMeaningKeys`.
- Every `requiredMeaningKeys` entry must map to an interpretation in the same manifest.
- Meaning keys must be unique across all language manifests.

The `canonical` and `transliteration` fields document the shared source files. The current loader continues to use
`public/data/canonical/kurals.ta.json` and `public/data/transliterations/ta-Latn.json` for every response.

## 5. Understand the API compatibility rule

The API currently has no `locale`, `language`, or `Accept-Language` selector. The loader discovers all manifests and
composes their exposed meanings into every Kural response.

Consequently, adding `fr_translation` changes the runtime response by adding that key to `meaning` for:

- `GET /api/kural/{id}`
- `GET /api/kural`
- `GET /api/daily`
- `GET /api/random`

The new interpretation is also included in keyword search. Existing Tamil and English fields must not be renamed,
removed, or changed.

If the new language is intended to be part of the documented public API, update the corresponding API contract
documentation and any UI that should display it. Do not add a locale query parameter or change response shape as part of
a data-only contribution.

## 6. Validate the language data

Run the data validator first:

```bash
npm run validate:data
```

It checks taxonomy IDs and ranges, canonical coverage, transliteration coverage, manifest structure, duplicate meaning
keys, interpretation metadata, and all 1,330 interpretation entries.

Then run the normal quality checks:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run build
npm run security:check
```

Review the generated diff before committing. In particular, verify that:

- Existing `ta` and `en` taxonomy names are unchanged.
- Existing meaning keys and texts are unchanged.
- The new locale has all 3 sections and all 133 chapters.
- Every new interpretation contains exactly 1,330 non-empty items.
- No credentials, generated build output, or unrelated files were added.

## What not to add

Do not add any of the following for a normal language contribution:

- `public/data/canonical/kurals.<locale>.json`
- `public/data/transliterations/<locale>.json`
- A second `sections.<locale>.json` or `chapters.<locale>.json`
- API locale parameters or response fields unrelated to the new interpretation data
- Per-Kural copies of file-level editorial metadata

Tamil canonical text, numeric Kural identity, taxonomy structure, and the existing Tamil transliteration remain shared
sources of truth.
