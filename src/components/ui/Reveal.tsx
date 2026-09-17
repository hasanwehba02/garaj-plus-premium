"use client";

import { createElement, useEffect, useRef, type ReactNode } from "react";

export default function Reveal({
  children,
  as = "div",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  as?: "div" | "p" | "h1" | "h2" | "h3" | "li" | "section";
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return createElement(as, { ref, "data-reveal": true, className, style: { "--d": `${delay}ms` } as React.CSSProperties }, children);
}
