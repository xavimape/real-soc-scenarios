# Real SOC Scenarios

**Live:** <https://real-soc-scenarios.javiermapelli.workers.dev> | Versión en español: [README.md](README.md)

> What triggered the alert · What the analyst looked at · Why they reached that conclusion

---

## What is this project?

SOC investigation cases, documented step by step. The goal is not to catalogue
threats — MITRE already does that — but to show the full reasoning: what the
alert said, what was verified, against which source, what was left unverified,
and why the analyst reached that conclusion and not another.

Each case combines narrative with interactive components — incident timeline,
indicator table, MITRE ATT&CK mapping and the closing report — so the reasoning
can be followed, not just the outcome.

A static, bilingual site, with one page per language resolved at build time from
the route.

## Current status

Twenty-one cases, complete in Spanish and English. Each language has its own route
and its own content file.

| | |
| --- | --- |
| Cases | 21, from `soc-001` to `soc-021` |
| Languages | Spanish and English, with verified parity |
| Generated pages | 45 |
| Difficulty | From `beginner` to `expert` |
| Frameworks used | ATT&CK Enterprise, ICS and Mobile; OWASP for API and for language models |

Twelve cases reconstruct publicly documented incidents. The other nine are
scenarios built for the exercise, and they say so on their first screen.

---

## Screenshots

Home: case deck and globe with the geography of the real incidents.

![Real SOC Scenarios home page](docs/screenshots/home.png)

Case page: analysis frameworks, closing report and side index with scroll
tracking.

![Case page, with the closing report and the side index](docs/screenshots/case.png)

---

## Sources and standard

Real cases are built from public material: agency advisories, research team
reports, vendor publications and official documents. Each scenario states its
source in the frontmatter and links techniques to the MITRE ATT&CK catalogue.

Indicators are published defanged and no infrastructure from any real environment
is included. Synthetic scenarios use the ranges and domains that RFC 5737, 2606
and 5398 reserve for documentation, so nothing that appears can resolve.

When two good sources disagree on a fact, the case records the disagreement
rather than choosing silently. When a fact is not verified against a primary
source, the case says so.

---

## Stack

- Astro 7 with MDX for content and Preact for the interactive components
- Content collections typed with Zod (`src/content.config.ts`)
- Theme and typography system via custom properties — see [THEMES.md](THEMES.md)
- Static site, no backend

---

## Structure

```text
src/
├── components/
│   ├── soc/               Case components (timeline, indicators, ATT&CK, report, frameworks)
│   ├── mdx/               Inline marks injected into the content
│   ├── SiteHeader.jsx     Header: configuration, links, brand and back
│   ├── AboutModal.jsx     About, as a dialog, from the home header
│   ├── CopyEmailButton.jsx  Contact: copies the address and says so
│   ├── CookieConsent.jsx  Cookie notice and analytics gate
│   ├── CaseDeck.jsx       Case deck on the home page
│   ├── Globe.jsx          Globe with the geography of the cases
│   └── TableOfContents.jsx  Side index with scroll tracking
├── config/                Catalogue of themes, fonts and languages
├── content/scenarios/
│   ├── es/                One .mdx per case
│   └── en/                Its English counterpart
├── data/                  Landmass mask for the globe (generated)
├── i18n/                  Interface dictionary and route helpers
├── layouts/               Base layout
├── pages/                 Root dispatch and /[lang]/ routes
├── styles/                Themes and per-piece styles
└── utils/                 Base-aware URL building

scripts/                   Checks that run over dist/
tools/                     Checks and generators that run over the source
```

---

## Commands

| Command                  | Action                                                        |
| ------------------------ | ------------------------------------------------------------- |
| `npm install`            | Install dependencies                                          |
| `npm run dev`            | Development server at `localhost:4321`                        |
| `npm run build`          | Generate the site in `./dist/`                                |
| `npm run preview`        | Serve the local build before deploying                        |
| `npm run deploy`         | Build, verify and publish to Cloudflare, in that order         |
| `npm run check`          | Catalogue, defanging, language, globe contrast and style        |
| `npm run check:catalogo` | Coherence across case files, over the `.mdx`                  |
| `npm run check:idioma`   | Sections written in the wrong language                        |
| `npm run audit:i18n`     | Interface translation coverage, over the source               |

**`npm run build` always comes before `npm run check`.** Two of the five checks
in the chain read `dist/` — defanging and language — so without building first
they review the previous build's content and pass green anyway. `check:catalogo`
reads the `.mdx`, which is why it runs first: it is the one that can give a
useful verdict even without a build.

---

## Adding a case

1. The file goes in `src/content/scenarios/es/NN-case-name.mdx`. The directory
   defines the language and the filename defines the URL.
2. The frontmatter follows the schema in `src/content.config.ts`. The numeric
   prefix must match `caseNumber`, and `caseId` is derived from that number as
   `soc-0NN`. The `locations` field is optional and places markers on the home
   globe.
3. Components are imported from `@/components/soc/`.
4. The route is generated at `/es/scenarios/<file-name>/`.

Components render statically by default. To enable filters, buttons and other
interaction they take `client:load`.

**Every interactive component receives `lang` with its file's language.** Without
that attribute, the component's interface renders in the default language inside
a page written in the other one.

The English version is written last, once the Spanish case is researched, loaded
and reviewed in the browser. Translating over content that can still change means
correcting twice.

---

## Analysis frameworks

Alongside the report components there are three frameworks that open in their own
dialog from a button. They are optional supporting material: not every case has
one, and several have none.

The rule: **if there is no real data to fill it, it does not go in.** A
half-filled framework teaches less than its absence, and the absence is explained
inside the case.

| Framework        | Included when…                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| `PyramidOfPain`  | The case has indicators across several rungs, or the lesson is *why* signature detection failed  |
| `DiamondModel`   | There is data at all four vertices: identified adversary, capability, infrastructure and victim  |
| `KillChain`      | You can point at which link the chain was cut, or why it was not cut at any                     |

All three require `client:load`: without hydration the button opens nothing.

Three cases use none of them, and the reason is written in each: two are better
described by the OWASP lists, because the audience is whoever writes the
application, and the third had no adversary.

---

## Content conventions

The inline marks `<Pass />`, `<Fail />` and `<Warn />` are available in any `.mdx`
without importing them. They are used when contrast is part of the argument —
three hypotheses where two do not hold, what a control detects versus what it does
not. A list where every line carries the same mark is not using the mark for
anything.

Iconography comes from `src/components/Icon.jsx`.

What an analyst would copy into a console or a search box stays identical in both
languages: commands, IP addresses, hashes, MITRE identifiers, malware family
names, detection rules and protocol codes.

---

## Deployment

The site is published on Cloudflare Workers, from the domain root. The
configuration is in `wrangler.jsonc`.

**`git push` does not publish anything.** It pushes the code to GitHub and stops
there; what the reader sees comes from a separate deployment. The two can drift
apart with nothing to warn you, so deployment goes through a single path:

```bash
npm run deploy
```

That command builds, verifies against the freshly made `dist/` and only then
publishes. If verification fails, there is no publication. It is also the only
place where `SITE_URL` is injected, so the real address travels with the moment
that matters.

Two environment variables govern the output, and `astro.config.mjs` reads them
with defaults for local development:

- **`BASE_PATH`** — the route prefix. On Cloudflare it is left undefined, because
  the site lives at the root. It exists so the same commit can be served from a
  subdirectory without touching the content.
- **`SITE_URL`** — the absolute URL used by the sharing tags and the `hreflang`
  links. `npm run deploy` injects it. Its default is still `localhost` on
  purpose: without the variable the layout does not emit the share card image,
  and better no image than one pointing at an address that does not exist.

No internal link is written by hand: they all go through `withBase()`, which is
what makes both forms work without touching the content.

---

## Contact and address privacy

The header's contact button **does not open the mail client**: it copies the
address to the clipboard and says so. Opening the client is an action with
consequences — a new window, sometimes an application that takes its time — and
someone who only wanted the address ends up closing things. Anyone who does want
to write has the button in the notice.

The address does not travel in the clear: it is assembled at runtime from its
parts, so the `something@something.tld` pattern does not exist in the HTML or in
the text of the JavaScript files until someone clicks. This is not cryptography
and does not pretend to be. Against a harvester that executes the code it is
useless; against the ones that scrape text, it works.

If the clipboard is unavailable — no secure context, no permission — the notice
shows the address to copy by hand instead of failing silently.

---

## Security

See [`SECURITY.md`](SECURITY.md) for how to report a problem. Important: the
cases are not production-ready detection rules. The queries and criteria that
appear are an educational starting point and need calibrating against the real
environment before use, which each case states in its own detection section.

## Responsible use

This project is educational and defensive in purpose. The cases describe attack
techniques in order to explain how each one is detected, not to reproduce them.

The material includes no exploitable code and no usable infrastructure.
Reconstructions of real incidents are based on already-disclosed public sources,
and the constructed scenarios use RFC-reserved addresses and domains that cannot
resolve.

The techniques described must not be applied against infrastructure belonging to
others, systems without authorisation, or production environments.

---

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the project's conventions — the nine
invariants, the verification order, the anatomy of a case — and how to propose
changes. This project follows a [Code of Conduct](CODE_OF_CONDUCT.md).

The most valuable contribution is a content correction: a misquoted fact, a
source that does not say what the case attributes to it, or a disagreement with
one of the readings.

---

## Licence

The code is under the MIT licence — see [LICENSE](LICENSE).

The case content is under Creative Commons Attribution 4.0 International — see
[LICENSE-CONTENT](LICENSE-CONTENT).

Two licences because the repository is two things: software and written material,
and they are not licensed the same way. Third-party material quoted in the cases
keeps its author's licence.

The changelog is in [CHANGELOG.md](CHANGELOG.md).
