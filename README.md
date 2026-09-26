# Garaj+ Premium — Ultra-Luxury 3D Automotive Customizer & Studio

A state-of-the-art 3D automotive detailing and Paint Protection Film (PPF) web experience built with **Next.js 16**, **React Three Fiber (R3F)**, **Three.js**, **Tailwind CSS v4**, **Lenis Smooth Scroll**, and **Zustand**.

---

## Key Features

- **3D Interactive Studio Customizer**:
  - **Mercedes-Benz C-Class (W206) High-Fidelity 3D Model**: Accurate vehicle geometry with automated spatial classification of monolithic body paint meshes into 13 discrete detachable panels.
  - **Interactive 3D Raycasting & Picking**: Click directly on any car panel (*Hood, Bumpers, Doors, Roof, Mirrors, Trunk*) in the 3D viewport or on the rims to toggle protection or inspect details with real-time hover tooltips.
  - **Progressive Laser PPF Wrap**: A synchronized golden laser blade sweeps across the vehicle in real-time, utilizing hardware clipping planes (`THREE.Plane`) transformed to match the car's orientation, applying film seamlessly as the laser advances.
  - **Dual TPU Surface Finishes**: Instantaneous switching between **Parlak TPU (Ultra-Gloss Clearcoat)** and **Saten Mat TPU (Frosted Satin Sheen)** with zero color distortion, true micro-roughness control, and factory paint integrity.
  - **Modular Panel Protection**: Select individual panels (*Kaput, Ön/Arka Tampon, Çamurluklar, Kapılar, Tavan, Aynalar, Bagaj*) or curated packages (*Ön Koruma, Şehir Paketi, Tam Koruma*).
  - **Dedicated Rim Customization (Jantlar)**: Live PBR rim finishes (*Parlak Siyah, Füme Krom, Saten Gümüş, Mat Siyah*) with automated camera gliding to the side profile.
  - **Free 360° Mouse Orbit & Inertia**: Drag to inspect the car from any angle with smooth orbital damping and intelligent camera focus angles.
  - **Dynamic Camera Viewpoints**: Seamless cinematic camera transitions between presets (*Front 3/4, Hood, Side Profile, Rear, Roof, Wheels*).

- **Real-Time Quote & WhatsApp Integration**:
  - Live price and discount calculation with auto-generated formatted WhatsApp quotation messages.
  - Floating quick-action WhatsApp button with smooth hover expansion.

- **Performance & Visual Excellence**:
  - WebGL pipeline with `RoomEnvironment` PMREM generation and subtle post-processing bloom.
  - Adaptive DPR scaling and frame-rate optimization.
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
│   ├── models/            # 3D GLB vehicle models (car.glb - Mercedes-Benz W206)
│   └── images/            # Studio photography and project assets
├── src/
│   ├── app/               # Next.js App Router (layout, pages, globals.css)
│   ├── components/
│   │   ├── CarConfigurator/ # Standalone 3D studio, loader, and interactive customizer
│   │   ├── experience/    # Hero & landing WebGL scene, 3D Car mesh, CameraRig, lighting
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

## White-Labeling & Client Customization

1. **Brand & Contact Information** (`src/lib/site-config.ts`):
   - Update studio name, phone, WhatsApp number, address, business hours, and social links.
   - Adjust factory paint swatches (`site.paints`) and brand accent colors (`site.theme`).
2. **Pricing & Packages** (`src/data/panels.ts` & `src/data/packages.ts`):
   - Modify base prices per panel, satin finish surcharges, and package bundle discounts.
3. **Logo** (`src/components/ui/Logo.tsx`):
   - Swap the SVG logo with the client's vector badge or logotype.
4. **3D Vehicle Model** (`public/models/car.glb`):
   - Replace `car.glb` and adjust `MODEL_FIT` / spatial classification bounds if using a different vehicle chassis.

---

## License

Private & proprietary repository. All rights reserved.
