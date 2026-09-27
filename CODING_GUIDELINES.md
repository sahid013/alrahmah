# Al Rahmah Project — Coding Guidelines

These rules apply to every line of code in this repository. Read this before writing code, and keep it updated when a convention changes.

## 1. Project layout

```
alRahmahProject/
├── CODING_GUIDELINES.md   ← this file
├── frontend/              ← Next.js + TypeScript website (active)
└── backend/               ← TypeScript API (set up, paused; connect later)
```

Backend and frontend are independent packages. They talk only over HTTP through the versioned API (`/api/v1/...`). Never import backend code into the frontend directly. Share types through the API contract (see §6).

## 2. General principles

- **TypeScript strict mode, always.** No `any`. Use `unknown` and narrow it. No `@ts-ignore` without a comment explaining why.
- **Single responsibility.** Each file does one thing. If a file passes ~200 lines, split it.
- **Reuse before you write.** Check `src/shared/` before adding a helper. If you write the same logic twice, extract it.
- **No hardcoded config.** URLs, secrets, ports and limits come from environment variables, validated in `src/config/env.ts`. Never commit `.env`; update `.env.example` instead.
- **Fail loudly, fail early.** Validate all input at the edge (request body, params, query, env). Throw typed errors (`AppError`); never return `null` to mean "something went wrong".
- **Naming:** `camelCase` for variables and functions, `PascalCase` for types and classes, `kebab-case` for file names, `UPPER_SNAKE_CASE` for constants and env vars.
- **Imports:** use the `@/` alias (`@/shared/...`) instead of long `../../..` paths.

## 3. Backend architecture (scalable by feature)

Code is organised **by feature (module)**, not by file type. Each feature is self-contained and can grow or be extracted without touching others.

```
backend/src/
├── app.ts                 ← builds the Express app (no listen) — testable
├── server.ts              ← starts the HTTP server, graceful shutdown
├── config/                ← env validation, constants
├── routes/                ← mounts module routers under /api/v1
├── modules/
│   └── <feature>/
│       ├── <feature>.routes.ts      ← HTTP paths → controller
│       ├── <feature>.controller.ts  ← req/res only, no business logic
│       ├── <feature>.service.ts     ← business logic, framework-free
│       ├── <feature>.repository.ts  ← data access only (DB / external API)
│       ├── <feature>.schema.ts      ← zod schemas + inferred types
│       └── <feature>.types.ts       ← public types / DTOs
└── shared/
    ├── errors/            ← AppError and subclasses
    ├── schemas/           ← reusable zod schemas (pagination, slug, SEO fields)
    ├── middlewares/       ← validate, errorHandler, notFound, ...
    └── utils/             ← asyncHandler, apiResponse, slugify, logger, ...
```

**Layer rules (one direction only):** `routes → controller → service → repository`.

- Controllers never touch the database. Services never touch `req`/`res`.
- Repositories are the only place that knows about the storage engine. Swapping the database means rewriting repositories only.
- To add a feature: copy an existing module folder (e.g. `modules/health`), rename, and register its router in `routes/index.ts`.

## 4. Reusable building blocks

Always use these instead of hand-rolling:

| Need | Use |
|---|---|
| Async route handler | `asyncHandler(fn)` — forwards errors to the error middleware |
| Validate body/query/params | `validate({ body, query, params })` with zod schemas |
| Success response | `sendSuccess(res, data, { status, meta })` |
| Throw an HTTP error | `new AppError(message, status, code)` or helpers like `NotFoundError` |
| URL-friendly identifiers | `slugify(text)` |
| Logging | `logger` (never `console.log` in committed code) |
| Pagination / slug params | `paginationQuerySchema`, `slugParamsSchema` + `buildPaginationMeta()` |
| SEO fields on content | `seoFieldsSchema.shape` spread into the content schema |

If a new pattern appears in two or more modules, add it to `shared/` and list it in this table.

## 5. API design (frontend-ready)

- **Versioned base path:** `/api/v1`. Breaking changes go to `/api/v2`; never break v1 silently.
- **REST, plural nouns:** `GET /api/v1/articles`, `GET /api/v1/articles/:slug`, `POST /api/v1/articles`.
- **One response envelope** for every endpoint so the frontend can use a single fetch wrapper:

  ```json
  { "success": true,  "data": { ... }, "meta": { "page": 1, "limit": 20, "total": 134 } }
  { "success": false, "error": { "code": "NOT_FOUND", "message": "Article not found", "details": [] } }
  ```

- **Correct status codes:** 200 read, 201 created, 204 deleted, 400 validation, 401/403 auth, 404 missing, 409 conflict, 500 unexpected.
- **Pagination** via `?page=&limit=` with `meta` in the response; cap `limit`.
- **CORS** allowed origins come from `CORS_ORIGINS` in env — add the frontend URL there, no code change.
- **Dates** are ISO 8601 UTC strings. **IDs** are strings.
- Never leak stack traces or internal messages in production responses.

## 6. Sharing types with the frontend

- Every request/response shape is defined as a zod schema in `<feature>.schema.ts`; TypeScript types are inferred with `z.infer`. This is the single source of truth.
- When the frontend is added, expose these via a shared package (e.g. `packages/contracts`) or generate an OpenAPI spec from the zod schemas. Keep schemas free of backend-only imports so they can be moved without edits.

## 7. SEO-friendly backend

The frontend renders the pages, but the backend decides whether they can be SEO-friendly. Every public content resource must support:

- **Slugs:** human-readable, unique, lowercase, hyphenated (`/articles/zakat-guide-2026`). Look up public content by `slug`, not by internal id. Keep old slugs as redirects when a slug changes (return `301` info to the frontend).
- **SEO fields on content models:** `metaTitle` (≤ 60 chars), `metaDescription` (≤ 160 chars), `canonicalUrl`, `ogImage`, `updatedAt`, and `noindex` where needed. Validate lengths in zod.
- **Structured data ready:** return the fields the frontend needs to build JSON-LD (author, publish date, organisation info).
- **Sitemap and robots:** the backend provides data for `sitemap.xml` (slug + `updatedAt` for every indexable resource) and the rules for `robots.txt`.
- **Speed matters for ranking:** paginate, select only needed fields, enable compression, send `Cache-Control`/`ETag` on public GET endpoints.
- **Correct status codes** (real `404`/`410`/`301`) so search engines index the right URLs.

## 8. Frontend (Next.js App Router)

Stack: Next.js 16 (App Router, Server Components), React 19, TypeScript strict, Tailwind CSS v4.

> This Next.js version has breaking changes from older tutorials. Check `frontend/node_modules/next/dist/docs/` before using an API you are unsure about.

```
frontend/src/
├── app/                   ← routes only: page.tsx, layout.tsx, loading/error/not-found
│   ├── layout.tsx         ← site-wide metadata, header/footer, Organization JSON-LD
│   ├── robots.ts, sitemap.ts, opengraph-image.tsx
│   └── <route>/page.tsx
├── components/
│   ├── ui/                ← generic, reusable (Button, ButtonLink, Container, Section)
│   ├── layout/            ← Header, Footer
│   ├── seo/               ← JsonLd
│   └── <feature>/         ← feature-specific (e.g. donations/DonationForm)
├── config/                ← env.ts (public env vars), site.ts (name, nav, SEO defaults)
├── lib/
│   ├── api/client.ts      ← the ONLY place that calls the backend
│   ├── seo.ts             ← buildMetadata()
│   └── utils/             ← cn(), formatters, ...
└── types/                 ← shared types (api.ts mirrors the backend envelope)
```

**Components**
- Use Server Components by default. Add `'use client'` only on the smallest component that needs state, effects or browser events, never on a whole page.
- Before creating a component, check `components/ui`. Variants go through props (`variant`, `size`), not copy-pasted markup.
- Components receive data via props and stay presentational; pages fetch data.
- Keep pages thin: compose sections from components.

**SEO checklist for every public page**
- Export `metadata = buildMetadata({ title, description, path })` (or `generateMetadata` for dynamic routes). This sets title, description, canonical URL, Open Graph and Twitter tags.
- Exactly one `<h1>` per page; sections use `<h2>` (the `Section` component does this).
- Semantic HTML: `header`, `nav`, `main`, `section`, `article`, `footer`; real `<a>` links for navigation (`Link` / `ButtonLink`), never `onClick` navigation.
- Images use `next/image` with meaningful `alt`, and `priority` on the main above-the-fold image.
- Add the route to `app/sitemap.ts`; mark private pages `noindex: true`.
- Add JSON-LD (`JsonLd`) where it fits: Organization, Article, Event, DonateAction.
- Descriptions ≤ 160 characters, titles ≤ 60.

**Backend integration**
- Never call `fetch` to the API directly from components. Use `api.get/post/...` from `lib/api/client.ts`. It unwraps `{ success, data }` and throws `ApiError`.
- The API URL comes from `NEXT_PUBLIC_API_URL`; the site URL from `NEXT_PUBLIC_SITE_URL`. Never put secrets in `NEXT_PUBLIC_*` variables.
- Until the backend is connected, keep placeholder data in one file per feature (e.g. `components/donations/data.ts`) so swapping it for an API call is a one-line change.
- Payments: the frontend never handles card data or secret keys. It asks the backend for a checkout session and redirects.

## 9. Design system

The tokens live in `frontend/src/app/globals.css` (`@theme`). That file is the single source of truth. Tailwind's default colours are **disabled**, so only brand tokens exist. Never hardcode a hex value or font name in a component.

### Colours

| Name | Token | Hex | Use for |
|---|---|---|---|
| **Rahmah Indigo** (primary) | `primary-500` | `#363287` | Brand colour: titles, primary buttons, footer, key UI |
| **Mercy Sky** (secondary) | `secondary-500` | `#25A6DE` | Accents: highlights, borders, badges, icons, background fills |
| **Charcoal** (neutral) | `neutral-500` | `#515153` | Body text, descriptions, borders, muted surfaces |

Each colour has a `50`–`950` scale (e.g. `bg-primary-50` light tint, `hover:bg-primary-600` hover). Feedback colours for forms and payment status: `success-50/700`, `warning-50/700`, `error-50/700`, plus `white` and `black`.

**Accessibility rules (WCAG AA):**
- `secondary-500` on white is **2.8:1 and is not readable as text**. Use it only for backgrounds, borders and decoration. For sky-blue text or links use `secondary-700` (5.2:1) or darker.
- Text on a `secondary-500` background must be dark: `primary-950` (6.9:1). Never white.
- `primary-500` (10.7:1) and `neutral-500` (7.9:1) are safe for text on white; white text on `primary-500` is safe.
- `neutral-400` (4.1:1) is for large or non-essential text only.

### Typography

| Role | Font | Token | Applied |
|---|---|---|---|
| Titles (h1–h6, hero titles, menu/popup titles, event titles) | **Forum** (400) | `font-heading` + `tracking-heading` + `text-title-*` sizes | Automatically on all `h1`–`h6`; `Heading` component |
| Descriptions and body copy | **Glacial Indifference** (400, 400 italic, 700) | `font-body` | Default on `body`; `Text` component |
| Buttons, nav links, small uppercase labels | **Glacial Indifference** Bold | `font-label` | `Button`/`ButtonLink`, `NavLinks`, eyebrows, captions |
| Numbers (countdowns, prayer times, event day numbers, badge ring) | **Poppins** (500/600/700) | `font-ui` | Explicitly, with `tabular-nums` for changing numbers |
| Campaign lockups only (e.g. "Make Space for Rahmah") | **PT Sans Narrow** (700) | `font-condensed` | `AppealWordmark` |
| Script accent lines only (e.g. "Peace Be Upon You") | **Sacramento** (400) | `font-script` | `GreetingSection`; decorative `<p>`, never headings or body text |

- Always use `<Heading level={n}>` and `<Text size="lead|body|small|caption">` from `components/ui/typography.tsx` instead of styling raw tags.
- **All headings are uppercase** Forum at its only weight (400); never add `font-medium`/`font-bold` to titles. Write heading text in normal case in code; CSS handles the caps.
- **Title sizes always come from the title scale** (`text-title-sm` … `text-title-6xl` in `globals.css`), where every step is **1.2×** the matching body step (e.g. `text-title-4xl` = 2.7rem vs `text-4xl` 2.25rem). Never size a title with plain `text-4xl` etc. To make all titles bigger or smaller, change the scale in one place. Current key sizes: hero title 72px desktop / 43px mobile, section titles 43px / 36px, event titles 19px.
- **Description sizes** (Glacial Indifference is light, so it's set generously): hero description 20px desktop / 18px mobile, section lead text 20px / 18px, supporting notes 16px, event dates 14px. Keep paragraphs to about 45–75 characters per line; cap the width (`max-w-xl`, `max-w-3xl`) rather than shrinking the text.
- Title letter-spacing is `tracking-heading` (0.02em). Small titles (≈16px, e.g. event titles) use `tracking-[0.05em]`.
- Uppercase UI labels always set `font-label` explicitly, so they never inherit the title font (e.g. "Upcoming events & programmes" is an `h2` styled as a label).
- **Never put times or numbers in the title font.** Anything containing times, dates or counts that must be read precisely uses `font-ui` (with `tabular-nums` if it changes).
- To keep a hyphenated name on one line, use a normal hyphen followed by a word joiner (`-\u2060`), as in the hero title "Al-Rahmah".
- Forum and Poppins come from `next/font/google`. Glacial Indifference is self-hosted from `src/app/fonts/glacial-indifference/` under the SIL Open Font License (`OFL.txt`; keep it with the files). All fonts are self-hosted with no layout shift.

### Brand assets

| File | Use |
|---|---|
| `public/brand/Logo.svg` | Full logo ("Al-Rahmah Faith Centre") for light backgrounds, used in the header. Case-sensitive path. |
| `public/brand/logo-light.svg` | Full logo in white / primary-100 + Mercy Sky, for the transparent header over dark sections |
| `public/brand/logo-mark-light.svg` | Emblem only, white + Mercy Sky, for dark backgrounds |
| `public/images/hero/al-rahmah-centre.webp` | Welcome slide: transparent cut-out of the Al-Rahmah Faith Centre building (1227×868), shown directly on the dark hero with `object-contain`, at 1.2× the column width on desktop (extends left into the gap; about 610px at 1440px). Optimised from the supplied `public/images/Common/Al Rahman Center.png`. |
| `public/images/appeal/appeal-building.webp` | Appeal slide: transparent cut-out (1853×750), same frame width as the Welcome slide, `object-contain`. Optimised from `public/images/Common/Appeal.png`. |

Paths and names live in `siteConfig` (`config/site.ts`). Reference them from there, not as string literals.

### Shape & surface (modern, flat)

- **No border radius anywhere.** All corners are square. The theme disables every `rounded-*` radius token, and ESLint rejects `rounded` classes in `src/`.
- **No gradient lighting:** no glows, radial light pools, gradient overlays or light sweeps. Use flat brand colours; ESLint rejects `gradient` in class names.
- No coloured or glowing shadows, drop shadows or backdrop blur. Separate layers with 1px borders (`border-neutral-200`, or `border-white/…` on dark) and solid backgrounds.
- The Islamic star pattern (`bg-islamic-pattern`, flat hairlines at very low opacity) is the only texture.

### Layout

- **Page gutter:** 16px mobile, 32px tablet, **64px desktop**, applied by `Container` (max width 96rem). Header, hero, sections and footer all use it so their edges line up. Don't add another horizontal padding on top.
- The hero is full-bleed (background edge to edge) with its content inside `Container`.
- **Header:** transparent (white logo and links) over dark first sections, on the routes listed in `siteConfig.headerOverlayRoutes`, while the page is at the top. It turns solid white once scrolled, slides up out of view when scrolling down, and slides back when scrolling up (`useHeaderScroll`). Pages on that list must pull their first dark section up under the header (`-mt-16 lg:-mt-[4.5rem]`) and add the header height to its top padding.

### Motion

- Motion is slow and intentional: use the `--ease-gentle` curve, and durations of about 1–1.6s for reveals and crossfades. No bouncy or fast effects.
- Every animation must have a `prefers-reduced-motion: reduce` fallback (see the hero rules in `globals.css`).
- One curve, `--ease-smooth`, for all motion, so fades and movement stay in step.
- Entrance motion settings live in `:root` in `globals.css`: `--motion-in` 1.1s, `--motion-step` 100ms, `--motion-shift` 120px (text), `--motion-shift-visual` 160px (images), `--motion-out` 0.3s. A slide change completes in about 1.7s. Tune there, never per component.
- Hero entrances: text slides in **from the left** (120px) and images **from the right** (160px), with fade and movement in the same keyframe. Every element uses the same duration and starts `--motion-step` after the previous one, by its position `--i` (the image moves with the title). On a slide change the old slide fades out completely before the new one starts. **Never use blur**; animate only transform/translate and opacity.
- Sections below the hero use `Reveal` (built into `Section`): content slides in from the left in the same rhythm when scrolled into view. Content stays visible without JavaScript and for reduced motion.
- **No hover movement:** buttons, images and icons never shift on the x or y axis on hover (no magnetic pull, parallax, lift or sliding arrows). Hover feedback is colour only.
- Micro-interactions: on hover a flat colour fills buttons from the left (`btn-fill` with `--btn-fill` per variant; outline buttons fill solid and their text turns white). Buttons press down on click and their icons scale up slightly. Secondary CTAs carry a static `ArrowRightIcon`. Nav links get an underline that grows from the left. The header hides and reveals on scroll, countdown digits flip (`FlipNumber`), and menus and popovers fade down into place (`animate-pop`).
- Auto-advancing content pauses on hover and keyboard focus and stops entirely for reduced-motion users. The hero deliberately has no visible slide controls (a design decision); it supports swipe on touch screens.

### Home hero slideshow

- Slides are data in `components/home/hero-slides.ts`, ready to come from the API later. Add a slide by adding an object; add a new visual in `hero-visuals.tsx` and register it in the `visuals` map.
- Only the first slide's title is the page `<h1>`; the others are `<h2>`. All slide text is server-rendered for SEO.
- The hero contains only the text column and a **plain image** (no offset outline square, inner frame or border). No text or cards are placed on the image. On desktop (`lg+`) the visual is a **square filling its column** (about 510px wide at 1440px), right-aligned. Below `lg` it's a compact 4:5 portrait (max 320–384px). Hero images should be at least 1100px wide (2× for sharp screens).
- **Keep hero copy short:** a label, the title, **one sentence** (about 15 words, `text-balance`) and the buttons. Longer text belongs on the linked page (the full welcome text is on `/about`, the full appeal on `/donate`); the secondary button links there.
- Timing: `SLIDE_DURATION_MS` in `hero-slideshow.tsx` (**4500ms** per slide, including the ~1.7s change-over). The image zoom-out (`.hero-drift`, scale 1.06 → 1) takes **3000ms**, so it always finishes before the slide changes. Keep it shorter than `SLIDE_DURATION_MS`. The reusable `useSlideshow` hook (`lib/hooks/use-slideshow.ts`) handles index, autoplay and pause for any carousel.

### Navigation

- Menu items live in `config/navigation.ts` (`mainNav`). Add a page by adding `{ label, href }`; give an item `children` to make it a dropdown. Use `isActivePath` / `isActiveItem` for current-page states.
- **Desktop dropdowns** (`NavDropdown` + `MegaMenu`) are a full-width, three-column panel: a dark indigo feature column (Get Involved: Donate / WhatsApp), the section's links (large Poppins, hairline dividers, sky bar and arrow on hover by colour/opacity only), and a light indigo info column (mosque icon, masjid name, WhatsApp). The panel appears with an opacity-only fade (`animate-fade`).
- Behaviour: opens on mouse hover, or on click / Enter / Space for touch and keyboard. Closes on mouse leave (short delay), Escape (focus returns to the trigger), outside click, or focus leaving. The links column comes first in the DOM, so Tab reaches the links first. The feature column is placed first visually with `lg:order-first`.
- **Events dropdown:** the `Events` nav item has `panel: 'events'`, so on desktop it renders `EventsMenu` (same frame and fade as `MegaMenu`). That's a light-indigo intro column ("Events & Courses" plus a primary **"View all events"** button) and the **latest 4 events**, each with a small poster preview, title, schedule and tertiary "Learn more". Its `children` (the 4 events plus "View all events") are generated from the events data for the mobile menu, so new events appear in the nav automatically.
- **Services dropdown:** a standard `MegaMenu` (Funerals, Education, Nikah). Nav links can have nested `children`: in the mega menu, a link with children shows a chevron, and hovering or focusing it swaps the right-hand info column for a light-indigo sub-panel of its pages (Education: Quran Academy, Sunday Weekly Lessons, Sisters' Only Lessons). It has `aria-expanded`/`aria-controls`. In the mobile menu nested pages are indented under their parent. `isActiveItem` checks nested children.
- **Placeholder pages:** routes linked before their content exists use `PlaceholderPage` (`components/ui/placeholder-page.tsx`: eyebrow, title, message, optional back link) with `noindex: true` metadata. Currently: Team, and all `/services/*` pages.
- **Follow Us dropdown:** the `Follow Us` nav item has `panel: 'socials'`, so it renders `SocialsMenu`. That's a compact white card (576px) anchored under the item (its `li` is `relative`), with a sky caption and square tiles separated by hairlines: 3 on the first row, the rest sharing the second. Each tile has a monochrome brand icon (indigo, sky on hover), and the platform name (Forum); no action labels. The tile tints `primary-50` on hover. Links open in a new tab. Data comes from `siteConfig.socials`, and the layout adapts to however many entries remain. **The URLs are currently placeholders** (platform home pages) and must be replaced with the masjid's real profiles. Brand marks may keep their native shapes (e.g. Instagram's rounded square); the square-corner rule applies to UI.
- **Mobile:** items with children become an expandable group inside the mobile menu.
- Pages linked from the menu that don't have content yet (Team) are placeholders with `noindex: true` and are left out of `sitemap.ts`. When real content is added, remove `noindex` and add them to the sitemap.

### Prayer times

- **One popup for the whole site:** `PrayerTimesProvider` (in `app/layout.tsx`) hosts a single native `<dialog>`. Any component opens it with `usePrayerTimesDialog().open()`. `showModal()` provides focus trapping, Escape to close, an inert background and focus return. Clicking the backdrop also closes it, and page scroll is locked while it's open.
- **Popup contents** (`prayer-times-panel.tsx`):
  - Left: a large live countdown with the next salah's icon, today's date, "Until Asr at 16:55" and the current time.
  - Right: the masjid name, date with previous/next day (up to 30 days ahead) and a "Today" shortcut, the Hijri date, and the five salah with icons (sunrise shown under Fajr, the next salah highlighted). Below that, the next Friday's Jumu'ah.
  - A Jama'ah column appears automatically once `Salah.jamaah` times exist.
- **One prayer-time widget, one place:** `PrayerTimesDock` (in `app/layout.tsx`) fixes the `NextSalah` card bottom-right on every page (a solid indigo base with `tone="dark"`; 0.9rem on mobile, 1rem at `sm`, 1.2rem at `lg`). It opens the shared popup and doesn't shrink on click. `NextSalah` sizes are all `em`-based. There is no prayer widget in the header or hero. Layouts leave room for it: the hero events strip takes only the left half on desktop, and the footer has extra bottom padding.
- **Data:** times come **only** from `lib/prayer-times.ts`, currently calculated with `adhan` from `siteConfig.prayer` (Leeds, Moonsighting Committee, Hanafi Asr, Europe/London). The module provides `getDayTimetable`, `getNextSalah`, `getNextFriday`, and date/Hijri formatters. To use the masjid's published timetable or jama'ah times, change that module (e.g. fetch from the backend); components don't change.
- On Fridays Dhuhr is labelled "Jumu'ah". After Isha the countdown rolls over to the next day's Fajr.
- **Every timer uses split-flap digits** (`FlipNumber` in `components/ui/flip-number.tsx`), in the header/hero card and the popup countdown. Each digit is four half-panels: static top (new digit), static bottom (old digit), and a leaf hinged on the seam (old on the front, new on the back) that falls 0 → −180° in `--flap-duration` (0.5s) with a small settle bounce. Flat black overlays shade the leaf and the half beneath it. Cards are **light blue at 30%** with **no border and no seam line** (square corners, no gradients). The tint is an opaque `color-mix` of light blue with the surface, not real transparency, so the falling leaf never shows the digit behind it. Sizes are in `em`, so set the font-size on `FlipNumber` to scale it. It has two tones (`dark` / `light`). Screen readers get the plain value, and with reduced motion digits change instantly (a flip never gets stuck mid-way).
- All widgets share `useSalahCountdown()` (built on `useNowSeconds()`, which returns `null` on the server), so there are no hydration mismatches.
- Prayer icons (`SunriseIcon`, `SunIcon`, `AfternoonIcon`, `SunsetIcon`, `MoonIcon`) are line icons with square caps.

### Greeting section (home, second section)

- `components/home/greeting-section.tsx`: a centred section on `bg-primary-50` with an "Assalamu Alaykum" `h2` (Forum, title scale), the "Peace Be Upon You" script line (`font-script`, `secondary-700` for contrast on the light tint, `text-balance`), the visitors paragraph (max width 4xl, `text-pretty`) and a primary "Learn about us →" button to `/about`. Each line reveals in sequence (`Reveal`).

### About page (`/about`)

- Composed from `PageHero` (`components/ui/page-hero.tsx`: reusable dark indigo title band with the faint star pattern, pulled up under the transparent header, so `/about` is in `headerOverlayRoutes`), then `components/about/`: `AboutIntro` (story paragraphs + highlighted closing statement beside the building cut-out on a `primary-50` panel), `BuildingFloors` (Ground/First Floor as `PatternCard`s + note) and `AboutHighlights` (Services, Brotherhood, Masjid History in three hairline-divided columns with a sky bar).
- `/vision-mission` is `PageHero` + Our Mission / Our Vision as two `PatternCard`s (`components/ui/pattern-card.tsx`: flat `primary-700`, faint star pattern, centred white Forum title and `primary-100` copy — reuse it for any short statement cards).
- All copy for both pages lives in `lib/about/data.ts`, ready to come from the dashboard later.

### Contact page (`/contact`)

- `PageHero` ("Contact Us"), then a two-column section: "Get in touch" with `ContactDetails` (email, address, phone in square `primary-50` icon tiles, then square social buttons) and `ContactForm` below a hairline; `ContactMap` (Google Maps embed, no API key) with a "Get directions" link on the right.
- Details, map and directions URLs come from `siteConfig.contact` (also used by the footer and the Mosque JSON-LD).
- **The form has no backend yet:** sending opens the visitor's email app with the message pre-filled to the masjid's address. When `/api/v1/contact` exists, replace `onSubmit` in `contact-form.tsx` with `api.post`.

### Impact section (home, after events)

- `components/impact/impact-section.tsx`, data in `lib/impact/data.ts` (`ImpactReport`: `year`, `intro`, optional `reportUrl`, `primary` group (left), `secondary` groups (middle, side by side), `featured` group (right panel)). **The figures are currently SAMPLES** and must be replaced with real ones (later from the dashboard).
- Deep indigo (`bg-primary-700`) with a full-height `primary-800` right panel (mosque line icon, centred figures). There's a faint white emblem in the middle column. Labels are sky `font-label` caps, figures are large Forum, and captions are `primary-100`. It stacks on mobile.
- **Figures drop in from above, in sequence:** the section is wrapped in `StaggerGroup` (a single IntersectionObserver trigger for the whole group). Each figure is a `.stagger-item` with `--i` = its position across the section (Volunteering → Education → Ramadan → Community). Each fades in from 28px above over 0.9s (`--ease-smooth`), `--stagger-step` (140ms) apart, so all seven finish in about 2s. Numbers are server-rendered, and there's no animation for reduced motion or if already on screen at load. Markup is `<dl>` (caption = `<dt>`, number = `<dd>`). `StaggerGroup` is reusable for any 'items appear one after another' effect.
- Spacing: 48px between figures in a group (`space-y-12`), 48px between side-by-side groups, 64px between the intro and the first group.
- "View {year} report" (outline-light) appears when `reportUrl` is set. It currently points to a placeholder page `/impact/[year]` (`noindex`); point `reportUrl` at the published PDF when it exists.
- Large *display statistics* may use the title font (Forum). Times, countdowns and any numbers read precisely at small sizes still use `font-ui`.

### Events & courses

#### Data architecture (dashboard-ready)

```
src/lib/events/
├── types.ts        ← zod schemas = the API contract (EventItem, EventSchedule, categories)
├── data.ts         ← local seed data (temporary, until the dashboard exists)
├── repository.ts   ← listEvents({ search, category, limit }), getEvent(id): the ONLY data source
├── schedule.ts     ← pure helpers: occursOn, occurrencesInRange, nextOccurrence, format*
├── calendar.ts     ← month grid maths, URL state (calendarHref), todayAtMasjid
├── index.ts        ← client-safe exports (types + schedule helpers)
└── events.test.ts  ← unit tests (npm test)
```

- **Only server code reads events**, via `repository.ts`: server components, `generateStaticParams`, `sitemap.ts` and `app/layout.tsx`. **Client components receive events as props**: `Header` → nav `Events` dropdown, `HeroSlideshow` → `UpcomingEvents`. Never import `data.ts` into a component.
- **Connecting the dashboard:** replace the body of `loadEvents()` in `repository.ts` with the API call (e.g. `GET /api/v1/events`) and keep the `eventSchema.array().parse(...)` validation. No component changes are needed. Use a cache tag (e.g. `events`) and have the dashboard revalidate it on save, so pages update immediately.
- **API contract** (`EventItem`): `id` (slug), `title`, `category` (`course | community | youth | sisters`), `schedule`, optional `scheduleLabel`, `summary`, `description`, `speaker`, `location`, `image { src, alt, width, height }`, `href`. The `schedule` is one of:
  - `{ kind: 'once', date: 'YYYY-MM-DD', time?, startTime?, endTime? }`
  - `{ kind: 'weekly', weekday, from?, until?, exceptDates?: string[], time?, startTime?, endTime? }`

  `time` is a human label ("After Asr"). `startTime`/`endTime` are `HH:mm` (24h), used to sort and display "7pm – 8:30pm". Weekly classes should set `from`/`until` for a term so they don't appear on every past week of the calendar.
- Dates are masjid-local (`Europe/London`). "Today" comes from `todayAtMasjid()`, never the visitor's clock.

#### Calendar page (`/events`)

- Deep navy page (in `headerOverlayRoutes`; pulled up under the transparent header).
- **Toolbar:** a white search bar (search + category select + sky "Find events"), as a plain GET form that works without JavaScript, plus a **List view / Month view** toggle.
- **Month header:** square ‹ › links, "This month" and the month title (Forum).
- **State lives in the URL** (`?month=YYYY-MM&view=list&q=&category=`) and is validated (a bad month falls back to the current month). Views are shareable, and prev/next are crawlable links. The page is dynamic (it reads `searchParams`).
- **Month view** (`MonthGrid`): Mon–Sun grid with hairline borders. Each day shows up to 3 events (sky time + white title link), then "+N more" linking to that day in list view. Today gets a sky number badge and tinted cell, and days outside the month are darker and dimmed. It uses ARIA grid roles with a full-date label per cell. **On screens below `md` the month view renders as the list**, because a 7-column grid is unreadable on phones.
- **List view** (`EventList`): the month's occurrences grouped by day, each with a poster thumbnail, time, category tag, title, schedule, speaker/location and "Learn more". Each day has an anchor `#d-YYYY-MM-DD`. There's a friendly empty state.

#### Event cards and sections

- **Hero strip** (`UpcomingEvents`, client component): takes the **left half** of the hero on desktop (`lg:w-1/2`, clear of the fixed prayer card) and shows **two events at a time**. Square ← → buttons (no page counter) slide a track of pages (700ms `--ease-smooth`, wrapping at both ends). Hidden pages are `inert`, and a polite live region announces the range. Each item is `EventCard tone="dark"`: poster thumbnail, title, schedule, "Learn more". On mobile each pair stacks.
- **Home events section** (`EventsSection`, after the greeting): deep navy background, a sky label, an "Events & Courses" `h2`, an intro and a tertiary "See all events →". Below that, a fixed 4-column grid (2 on tablet, 1 on mobile) of `EventPosterCard`s that reveal in sequence.
- **`EventPosterCard`** shows only the poster at its natural height. On hover or keyboard focus a **solid deep navy overlay** (`bg-primary-950`) fades in, and the card's 1px light-blue border fades from 0% to 10% opacity. Then the schedule, title, speaker, summary and a light-blue "Learn more" fade in one after another (opacity only). Touch devices get a white caption under the poster instead.
- **Nav "Events" dropdown** (`EventsMenu`): an intro column with "View all events", plus the latest 4 events, each with a small poster preview (64px wide), title, schedule and "Learn more" (no separate date box; the schedule already states the date).
- **Event pages** (`/events/[id]`): poster, schedule, title, speaker and description, statically generated from the repository (`dynamicParams = false`) and listed in the sitemap.
- Schedule text everywhere uses `eventScheduleText(event)`: the client's exact `scheduleLabel`, or the formatted schedule. Summaries are the client's wording.
- **Posters** live in `public/images/events/<id>-poster.webp`: optimised copies (1000px wide) of the supplied originals. Record each poster's `width`/`height` in the data.

### Components using the system

`Button` / `ButtonLink` (square, uppercase; `primary`, `secondary`, `outline`, `outline-light` for dark backgrounds, `ghost`, and text-only `tertiary` / `tertiary-light` with no outline, fill or padding, only a colour change on hover; `sm`/`md`/`lg`), `Heading`, `Text`, `Section`, `Container`, `Header` (sticky, 64px / 72px tall, transparent over dark heroes, hides on scroll down), `NavLinks`, `NavDropdown`, `MegaMenu`, `MobileNav`, `NextSalah`, `PrayerTimesDock`, `UpcomingEvents`, `EventCard`, `Footer`, icons in `components/icons`. New components must use these tokens and, where possible, compose these components.

## 10. Security

- Validate and sanitise every input with zod. Never trust the client.
- `helmet` for security headers, rate-limit public endpoints, restrict CORS to known origins.
- Secrets only in env vars. Hash passwords (argon2/bcrypt). Parameterised queries only.

## 11. Quality checks

Before committing, all of these must pass:

```bash
# frontend/
npm run typecheck && npm run lint && npm run format:check && npm test && npm run build

# backend/
npm run typecheck && npm run lint && npm run format:check && npm test
```

- Write tests for services (business logic) first; test routes via `app.ts` with supertest.
- Keep commits small and focused; the message explains *why*.
