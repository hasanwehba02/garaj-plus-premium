import Image from "next/image";
import { site } from "@/lib/site-config";

/** Client logo image (site.logo). Their logo already contains the wordmark,
 *  so text is off by default; pass showText for logos that are emblem-only. */
export default function Logo({ className = "", showText = false }: { className?: string; showText?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <Image src={site.logo} alt={site.name} width={250} height={80} priority className="h-full w-auto" />
      {showText && (
        <span className="flex flex-col leading-none">
          <span className="text-[1.05rem] font-semibold tracking-[0.16em] text-pearl">{site.wordmark}</span>
          {site.suffix && <span className="mt-1.5 text-[0.62rem] font-medium tracking-[0.16em] text-gold">{site.suffix}</span>}
        </span>
      )}
    </span>
  );
}
