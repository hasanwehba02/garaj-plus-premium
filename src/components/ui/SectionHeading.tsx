import Reveal from "./Reveal";

export default function SectionHeading({
  index,
  eyebrow,
  title,
  accent,
  text,
  align = "left",
}: {
  index?: string;
  eyebrow: string;
  title: string;
  accent?: string;
  text?: string;
  align?: "left" | "center";
}) {
  const center = align === "center";
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      <Reveal className={`eyebrow flex items-center gap-4 ${center ? "justify-center" : ""}`}>
        {index && <span className="text-gold">{index}</span>}
        <span className="h-px w-10 bg-gold/50" />
        <span>{eyebrow}</span>
      </Reveal>
      <Reveal as="h2" delay={80} className="mt-6 text-4xl font-semibold leading-[1.04] tracking-[-0.02em] text-balance md:text-6xl">
        {title} {accent && <em className="font-display font-bold gold-text">{accent}</em>}
      </Reveal>
      {text && (
        <Reveal as="p" delay={160} className={`mt-6 max-w-xl text-base leading-relaxed text-mist md:text-lg ${center ? "mx-auto" : ""}`}>
          {text}
        </Reveal>
      )}
    </div>
  );
}
