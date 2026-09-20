# Garaj+ Premium — Ultra-Luxury 3D Automotive Customizer & Studio

A state-of-the-art 3D automotive detailing and Paint Protection Film (PPF) web experience built with **Next.js 16**, **React Three Fiber (R3F)**, **Three.js**, **Tailwind CSS v4**, **Lenis Smooth Scroll**, and **Zustand**.

---

## Key Features

- **3D Interactive Studio Customizer**:
  - **Progressive Laser PPF Wrap**: A golden laser blade sweeps across the vehicle in real-time, utilizing hardware clipping planes (`THREE.Plane`) that dynamically transform with the car's yaw rotation to apply PPF strictly as the laser passes each panel.
  - **Dual TPU Surface Finishes**: Choose between **Parlak TPU (Ultra-Gloss Clearcoat)** and **Saten Mat TPU (Frosted Satin Sheen)** with zero color distortion and 100% solid factory paint retention.
  - **Modular Panel Protection**: Select individual panels (*Kaput, Ön/Arka Tampon, Çamurluklar, Kapılar, Tavan, Aynalar, Bagaj*) or curated packages (*Ön Koruma, Şehir Paketi, Tam Koruma*).
  - **Dedicated Rim Customization (Jantlar)**: Live PBR rim finishes (*Parlak Siyah, Füme Krom, Saten Gümüş, Mat Siyah*) with automated camera gliding to the side profile.
  - **Free 360° Mouse Orbit**: Left-click and drag horizontally to spin the car with fluid inertia decay.
  - **Dynamic Camera Viewpoints**: Seamless camera transitions between angles (*Front 3/4, Hood, Side Profile, Rear, Roof*).

- **Real-Time Quote & WhatsApp Integration**:
  - Live price and discount calculation with auto-generated formatted WhatsApp quotation messages.
  - Floating bottom-right quick-action WhatsApp button with smooth hover expansion.

- **Performance & Visual Excellence**:
  - Post-processing pipeline with subtle bloom and filmic tone mapping.
  - Adaptive DPR scaling and low-power detection via `@react-three/drei` performance monitors.
  - Silky-smooth cinematic scrolling with Lenis.

---

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router & Turbopack)
- **3D & WebGL**: [Three.js](https://threejs.org/), [@react-three/fiber](https://r3f.docs.pmnd.rs/), [@react-three/drei](https://github.com/pmndrs/drei), [@react-three/postprocessing](https://github.com/pmndrs/react-postprocessing)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with OKLCH/HSL dark glassmorphism design tokens
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Smooth Scrolling**: [Lenis](https://lenis.darkroom.engineering/)

---

## Getting Started

### Prerequisites
- Node.js 18.18+ or Node.js 20+
- npm, pnpm, or yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/hasanwehba02/garaj-plus-premium.git
cd garaj-plus-premium

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build & Verification

```bash
# Build optimized production bundle
npm run build

# Start production server
npm start
```

---

## Project Architecture

```
garaj-plus-premium/
├── public/
│   ├── models/            # 3D GLB vehicle models (car.glb)
│   └── images/            # Studio photography and project assets
├── src/
│   ├── app/               # Next.js App Router (layout, pages, globals.css)
│   ├── components/
│   │   ├── experience/    # WebGL scene, 3D Car mesh, CameraRig, Studio lighting
│   │   ├── sections/      # Landing sections (Hero, Film, Healing, StudioSection, Contact)
│   │   └── ui/            # Nav, Logo, WhatsappButton, Reveal animations
│   ├── data/
│   │   ├── packages.ts    # Detailing & PPF package configurations & discounts
│   │   └── panels.ts      # Panel metadata, pricing, and category mappings
│   └── lib/
│       ├── car-config/    # Studio parts and camera viewpoint definitions
│       ├── store/         # Zustand global experience & configurator stores
│       └── site-config.ts # Client branding, contact details, paint swatches & pricing
```

---

## White-Labeling & Client Re-Branding (15-min Setup)

1. **Brand & Contact Information** (`src/lib/site-config.ts`):
   - Update studio name, phone, WhatsApp number, address, business hours, and social media links.
   - Adjust factory paint swatches (`site.paints`) and brand accent colors (`site.theme`).
2. **Pricing & Packages** (`src/data/panels.ts` & `src/data/packages.ts`):
   - Modify base prices per panel, satin finish surcharges, and package bundle discounts.
3. **Logo** (`src/components/ui/Logo.tsx`):
   - Swap the SVG logo with the client's vector badge or logotype.
4. **3D Vehicle Model** (`public/models/car.glb`):
   - Replace `car.glb` and adjust `MODEL_FIT` in `src/components/experience/Car.tsx` if using a different vehicle chassis.

---

## License

Private & proprietary repository. All rights reserved.

