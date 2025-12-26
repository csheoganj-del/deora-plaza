# Frosted Glass Style Guide

## Color Scheme
- Background: `#FFDAB9` (soft peach)
- Primary accents: `#FFFFFF` (white)
- Text on frosted surfaces: prefer `text-slate-900` (light mode), `text-white` (dark mode)

## Tokens
- `--frosted-blur-light`: `8px`
- `--frosted-blur-medium`: `10px`
- `--frosted-blur-heavy`: `12px`
- `--frosted-opacity-light`: `0.85`
- `--frosted-opacity-medium`: `0.88`
- `--frosted-opacity-heavy`: `0.90`
- `--frosted-texture-opacity`: `0.06`

## Utilities
- `frosted-glass-light` / `medium` / `heavy`: backdrop blur, saturation, brightness
- `frosted-texture`: subtle granule overlay
- `frosted-interactive`: hover/active motion and shadow
- Fallback: `@supports not (backdrop-filter: ...)` adds solid peach background

## Components
- Header and Sidebar: `glass-panel frosted-texture`
- Dialog Overlay: `bg-white/15 backdrop-blur-md`
- Dialog Content: `frosted-glass-heavy frosted-texture`
- Sheet: `frosted-glass-medium frosted-texture`
- Cards: use `FrostedCard` or `GlassCard` with `variant="frosted"`

## Accessibility
- Maintain contrast ratio ≥ 4.5:1 for body text
- Use `text-slate-900` on peach surfaces, `text-white` on dark overlays
- Avoid pure white text on brighter peach backgrounds for small text

## Performance
- Prefer medium blur (`10px`) for most surfaces
- Use texture overlay sparingly on large containers
- Rely on CSS-only effects; no runtime canvas filters

## Examples
- Light card: `<GlassCard variant="frosted" frostedIntensity="light" className="p-6">...</GlassCard>`
- Modal: `<DialogContent className="frosted-glass-heavy frosted-texture">...</DialogContent>`

