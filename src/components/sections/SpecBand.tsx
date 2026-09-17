import { site } from "@/lib/site-config";
import { Marquee } from "../ui/Marquee";

export default function SpecBand() {
  return (
    <div className="border-y hairline py-6">
      <Marquee pauseOnHover className="[--duration:36s] [--gap:3rem]">
        {site.filmSpecs.map((s) => (
          <span key={s} className="flex items-center gap-12 whitespace-nowrap font-display text-3xl text-pearl/90 md:text-4xl">
            {s}
            <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
          </span>
        ))}
      </Marquee>
    </div>
  );
}
