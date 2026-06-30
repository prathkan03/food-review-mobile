---
name: CulinaReview
colors:
  surface: '#fff8f6'
  surface-dim: '#ebd6cc'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1eb'
  surface-container: '#ffeae0'
  surface-container-high: '#fae4d9'
  surface-container-highest: '#f4ded4'
  on-surface: '#241913'
  on-surface-variant: '#574237'
  inverse-surface: '#3a2e27'
  inverse-on-surface: '#ffede5'
  outline: '#8b7265'
  outline-variant: '#dec1b1'
  surface-tint: '#9a4600'
  primary: '#9a4600'
  on-primary: '#ffffff'
  primary-container: '#f47b25'
  on-primary-container: '#592500'
  inverse-primary: '#ffb68d'
  secondary: '#6b5b52'
  on-secondary: '#ffffff'
  secondary-container: '#f4ded2'
  on-secondary-container: '#716158'
  tertiary: '#00658f'
  on-tertiary: '#ffffff'
  tertiary-container: '#00a7e9'
  on-tertiary-container: '#003852'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbc9'
  primary-fixed-dim: '#ffb68d'
  on-primary-fixed: '#321200'
  on-primary-fixed-variant: '#763400'
  secondary-fixed: '#f4ded2'
  secondary-fixed-dim: '#d7c2b7'
  on-secondary-fixed: '#241912'
  on-secondary-fixed-variant: '#52443b'
  tertiary-fixed: '#c7e7ff'
  tertiary-fixed-dim: '#85cfff'
  on-tertiary-fixed: '#001e2e'
  on-tertiary-fixed-variant: '#004c6c'
  background: '#fff8f6'
  on-background: '#241913'
  surface-variant: '#f4ded4'
  background-light: '#f8f7f5'
  background-dark: '#221710'
  slate-500: '#64748b'
  slate-900: '#0f172a'
  star-active: '#f47b25'
  star-inactive: '#e2e8f0'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-margin: 1.25rem
  stack-gap: 1rem
  section-gap: 2rem
  card-padding: 1.25rem
---

## Brand & Style

CulinaReview is a premium, lifestyle-focused food rating platform. The brand personality is **warm, inviting, and community-driven**, sitting at the intersection of **Modern Corporate** and **Lifestyle Casual**. It leverages an iOS-inspired aesthetic with soft shadows and high-quality whitespace to create a sense of trust and "app-like" familiarity.

The visual style employs **Soft Minimalism** with a focus on tactile interaction. It uses a sophisticated "Fidelity" color strategy where the primary brand color is used sparingly as an accent for high-importance actions and indicators (like stars and primary buttons), while the rest of the interface breathes through neutral, airy surfaces. The goal is to make the act of "rating" feel effortless and premium rather than clinical.

## Colors

The palette is centered around a vibrant **Primary Orange (#f47b25)**, which signifies energy, appetite, and action. This is balanced by a sophisticated **Off-White Background (#f8f7f5)** that feels more natural and "organic" than pure paper white.

- **Primary:** Used for call-to-action buttons, active star ratings, and navigational accents.
- **Surface:** A mix of pure white (`#ffffff`) for elevated cards and light grey-beige for the base background.
- **Content:** Deep slates (`#0f172a`) are used for primary text to maintain high legibility, while mid-range slates handle secondary labels and icons.
- **Interaction:** A subtle 5-10% opacity version of the primary color is used for "Add" button backgrounds and subtle borders to maintain brand cohesion without visual fatigue.

## Typography

The system uses **Plus Jakarta Sans** exclusively to achieve a modern, slightly rounded, and friendly character. 

- **Hierarchy:** Established through significant weight shifts (Bold vs. Regular) rather than just size.
- **Micro-Copy:** Uses a specific "Label-Caps" style for section headers (e.g., "Step 1 of 2") to provide clear structural signposts without competing with content headings.
- **Input Text:** Uses `body-lg` (18px) for user-entered dish names to make the content feel like the most important element on the screen.
- **Mobile Optimization:** Headlines are kept below 24px to ensure they don't wrap awkwardly on smaller devices, prioritizing density and clarity.

## Layout & Spacing

The system follows an **iOS-centric safe area model** with a fluid vertical stack. 

- **Margins:** A standard 20px (`1.25rem`) horizontal margin is maintained for all main content containers.
- **Vertical Rhythm:** A base unit of 4px is used. Cards are separated by 16px (`1rem`), while major logical sections (like the Header to the List) are separated by 32px (`2rem`).
- **Sticky Elements:** The design utilizes a "Sticky Header" and "Sticky Footer" model. Both use `backdrop-blur` (vibrancy) to allow the content to peek through while maintaining a clear focus on the current task and the primary "Continue" action.

## Elevation & Depth

Hierarchy is communicated through **Ambient Shadows** and **Tonal Layering**:

- **Level 0 (Background):** The base layer uses the `background-light` color, providing a low-contrast foundation.
- **Level 1 (Cards):** Interactive containers use pure white with a very soft, diffused shadow (`0 4px 6px -1px rgba(0, 0, 0, 0.05)`). This "iOS shadow" style makes cards feel like they are floating slightly above the surface.
- **Overlays (Sticky Bars):** The Top Nav and Bottom Action Bar use a `90%` opacity background with a high `backdrop-blur` (blur-xl) to simulate frosted glass, keeping the user anchored in their scroll position.
- **Subtle Borders:** Cards use a very faint border (`slate-100`) to define edges on high-brightness displays where the shadow might be lost.

## Shapes

The shape language is **distinctly rounded** to reinforce the friendly brand personality.

- **Primary Containers:** Standard cards and the main CTA button use `rounded-xl` (12px to 16px).
- **Secondary Elements:** Image thumbnails and secondary buttons use `rounded-lg` (8px).
- **Interactive Indicators:** The "Home Indicator" and certain tag elements use `rounded-full` for a pill-shaped appearance.
- **Form Inputs:** No hard boxes; inputs are integrated into card structures or use soft rounding to match the surrounding container.

## Components

### Buttons
- **Primary Action:** Full-width, `primary_color_hex` background, bold white text. Includes a soft shadow tinted with the primary color (`shadow-primary/25`).
- **Ghost/Text Buttons:** Used for "Cancel" or "Back" actions; use primary color text with no background.
- **Dashed Add Button:** A full-width button with a `border-2 border-dashed` stroke using `primary/30` and an icon-label pair.

### Cards
- **Dish Card:** A complex component containing a `label-caps` heading, a borderless `body-lg` input field, and a dedicated rating section at the bottom separated by a faint horizontal rule.
- **Restaurant Card:** A compact header component with a fixed-size square image (rounded-lg) and stacked text.

### Inputs
- **Borderless Fields:** Text inputs within cards should have no borders or background, relying on the card's structure for containment. Placeholder text uses `slate-300`.
- **Star Rating:** Large (32px) icons. Active state is `star-active`, inactive is `star-inactive`.

### Lists
- Standard vertical stack with a `1rem` gap. Cards should use `ios-shadow` for separation rather than dividers where possible.