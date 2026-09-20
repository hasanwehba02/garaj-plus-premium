# Garaj Plus Premium — premium 3D studio website (resellable template)

Next.js 16 · React Three Fiber · drei · Tailwind v4 · Lenis · zustand

```bash
npm install
npm run build && PORT=3025 npm start   # verify 3D in production mode (dev/HMR can glitch R3F)
```

## Re-brand for a new client (≈15 minutes)

1. **`src/lib/site-config.ts`** — name, wordmark, colours (`theme`), contact, WhatsApp, prices, services, packages, reviews, FAQ, paint swatches, coverage presets. Everything marked `// TODO client`.
2. **Logo** — `src/components/ui/Logo.tsx` (shield monogram + wordmark from config). Replace the SVG with the client's logo if they have one.
3. **Car** — drop a GLB into `public/models/` and set `NEXT_PUBLIC_CAR_MODEL=/models/your.glb`. Tune `MODEL_FIT` at the top of `Car.tsx`. Keep the model licence credit in `site.modelCredit`.
4. **Camera shots** — `KEYS` in `src/components/experience/CameraRig.tsx`.

## How the 3D works

One fixed `<Canvas>` sits behind the page. Sections carry `data-stage="…"`; `ScrollController` turns scroll into `from → to (t)` and the camera glides between keyframes. Tall sticky chapters also set `data-local` for 0..1 progress (film wrap %, gloss→satin).

- `?debug` — logs car materials / draw calls.
- Low-end / touch devices automatically get a lighter floor and lower DPR.
