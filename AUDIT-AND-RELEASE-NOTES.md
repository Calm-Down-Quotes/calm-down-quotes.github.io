# Calm Down Quotes — final release audit

## Content and copyright

- The existing 430-entry library is preserved unchanged in `content-review/original-quotes-preserved.json`.
- That legacy library contains 16 duplicate texts, 71 entries marked “Unknown”, multiple likely misattributions, culturally broad labels such as “Native American Wisdom”, and quotations attributed to modern authors whose wording may still be protected.
- Because preservation and safe publication are different requirements, the legacy collection is **not loaded by the public site** until each item’s source, translation, attribution and reuse status is verified.
- The public release uses 48 purpose-written `Calm Down Quotes original` entries in `quotes-safe.json`. This is the lowest-risk approach and creates a distinctive voice.
- This is a practical content-risk audit, not legal advice. A qualified intellectual-property lawyer should review any future plan to republish the legacy collection.

## Stability and efficiency

- Static HTML, CSS and JavaScript: no framework runtime, account or database required.
- Local fallback quote prevents a blank experience if the JSON library fails.
- Service worker caches the core experience and backgrounds for repeat visits and basic offline resilience.
- Saved quotes and atmosphere preferences remain in local storage.
- Local background assets prevent third-party hotlink failures.

## Security and privacy

- Restrictive Content Security Policy; no camera, microphone, location or form collection.
- No user-supplied HTML is injected without escaping.
- External share links use `noopener,noreferrer`.
- Share-image generation occurs locally in the visitor’s browser.
- Privacy and terms pages match the implemented features.

## Accessibility and emotional safety

- Semantic navigation, headings, blockquote, dialog and focus restoration.
- Keyboard escape closes the share dialog.
- Visible focus rings and reduced-motion support.
- No automatic quote changes, alerts, countdowns, intrusive pop-ups or urgency language.
- Clear non-medical boundary without interrupting the calming experience.

## Functionality

- Three remembered atmospheres with time-appropriate first default.
- Random and feeling-matched quotes, saved collection and exact-quote URLs.
- Native mobile sharing plus WhatsApp, Facebook, X and email fallbacks.
- Copy link and locally generated 1080×1350 social image.
- PWA manifest, offline cache, robots file, sitemap and custom 404 page.

## Deployment

Upload every file except this audit note and the `content-review` folder to the GitHub Pages repository root. Keep the audit and preserved library privately for records unless and until the legacy content is cleared.
