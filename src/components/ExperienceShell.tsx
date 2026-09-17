"use client";

import dynamic from "next/dynamic";
import ScrollController from "./ScrollController";
import Nav from "./ui/Nav";
import Loader from "./ui/Loader";
import WhatsappButton from "./ui/WhatsappButton";

const Scene = dynamic(() => import("./experience/Scene"), { ssr: false });

export default function ExperienceShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ScrollController />
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <Scene />
      </div>
      <div className="vignette" aria-hidden />
      <div className="grain" aria-hidden />
      <Loader />
      <Nav />
      <WhatsappButton />
      <main className="relative z-10">{children}</main>
    </>
  );
}
