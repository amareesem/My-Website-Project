# PEAK visual system

This file is the design reference for the Lori brief. Stage 3 applies it to the shared chrome and the homepage. Later stages apply it page by page.

## Color

Use only these colors:

| Role | Hex |
| --- | --- |
| Primary | `#215387` |
| Secondary | `#2B6CB0` |
| Charcoal | `#1A202C` |
| Secondary charcoal | `#2D3748` |
| Light blue-gray | `#EDF2F7` |
| Off-white | `#F7FAFC` |
| White | `#FFFFFF` |

The primary blue is the only button fill. White text on `#215387` is about 8:1, which clears WCAG AA. Hover uses charcoal `#1A202C`, which is already in the palette. Links use the secondary blue. Body text is charcoal on off-white or white. The header is charcoal with off-white type.

Do not use olive, cream, clay, gold, purple, or a second button color.

The homepage photo keeps a flat charcoal scrim, `rgba(26, 32, 44, 0.72)`. It is a solid overlay, not a glow or a gradient. Cream is not used on that photo. The type on the photo is off-white.

## Type

Self-hosted, `font-display: swap`.

- Headings: Lora (files in `assets/fonts/lora-*.woff2`)
- Body: Inter (files in `assets/fonts/inter-*.woff2`)

Both families are used under the SIL Open Font License.

Sizes, kept in the calmer range Lori already preferred:

- Body: 17px to 19px (`1.0625rem` to `1.1875rem`), line-height 1.6
- h1: `2.25rem` to `3.25rem`
- h2: `1.75rem` to `2.25rem`
- h3: `1.25rem` to `1.5rem`
- Line length for paragraphs: about 65 characters

## Layout

Generous space between sections. Cards are few, white, and lightly bordered. Corners are slight, not bubbles. Pills, buttons, and badges grow with their text. Padding is at least 12px on a small label and 14px by 22px on a button. Nothing uses a fixed height that clips a sentence.

Icons are minimal. There is no icon grid, no gradient text, no glass, and no glow.

Motion is limited to a color change on hover. `prefers-reduced-motion: reduce` turns off smooth scrolling.

## Navigation

Desktop and the mobile menu use the same set:

Home, Meet the Physicians, The Program, Who We Help, The Evidence, Resources, Investment, Contact.

The e-book is not in the menu. A single button says "Schedule a Consultation" and opens the existing booking page.

The mobile control is a `details` menu with a visible Menu label, a skip link, and a focus outline.

## Homepage photo

Gray and Brown Mountain, Pixabay, Pexels License. Source and credit: `assets/photos/hero-mountain-credit.txt`.
