"use client";

import ScrollController from "./ScrollController";
import Nav from "./ui/Nav";
import WhatsappButton from "./ui/WhatsappButton";

export default function ExperienceShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollController />
      <div className="vignette" aria-hidden />
      <div className="grain" aria-hidden />
      <Nav />
      <WhatsappButton />
      <main className="relative z-10">{children}</main>
    </>
  );
}
