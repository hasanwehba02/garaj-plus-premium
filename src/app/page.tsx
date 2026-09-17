import ExperienceShell from "@/components/ExperienceShell";
import Hero from "@/components/sections/Hero";
import FilmChapter from "@/components/sections/FilmChapter";
import HealingChapter from "@/components/sections/HealingChapter";
import FinishChapter from "@/components/sections/FinishChapter";
import StudioSection from "@/components/sections/StudioSection";
import SpecBand from "@/components/sections/SpecBand";
import Services from "@/components/sections/Services";
import Packages from "@/components/sections/Packages";
import Compare from "@/components/sections/Compare";
import Process from "@/components/sections/Process";
import Reviews from "@/components/sections/Reviews";
import Faq from "@/components/sections/Faq";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";

/**
 * Every section with `data-stage` moves the 3D camera to that stage's
 * keyframe (see components/experience/CameraRig.tsx). Sections without it
 * simply scroll over the scene.
 */
export default function Page() {
  return (
    <ExperienceShell>
      <Hero />
      <FilmChapter />
      <HealingChapter />
      <FinishChapter />
      <StudioSection />
      <div className="veil">
        <SpecBand />
        <Services />
        <Packages />
        <Compare />
        <Process />
        <Reviews />
        <Faq />
        <Contact />
        <Footer />
      </div>
    </ExperienceShell>
  );
}
