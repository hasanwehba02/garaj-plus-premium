const paths: Record<string, React.ReactNode> = {
  shield: <path d="M12 2.5 20 5.5v6.2c0 4.9-3.4 8.6-8 10.3-4.6-1.7-8-5.4-8-10.3V5.5Z M8.5 12l2.4 2.4 4.6-4.8" />,
  satin: <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5a8.5 8.5 0 0 0 0 17Z" fill="currentColor" stroke="none" opacity=".35" /></>,
  drop: <path d="M12 3.2c3.4 4.1 6 7.6 6 10.8a6 6 0 0 1-12 0c0-3.2 2.6-6.7 6-10.8Z M9 14.5a3 3 0 0 0 3 3" />,
  sun: <><circle cx="12" cy="12" r="3.8" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" /></>,
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M12 8.5l1.2 2.3 2.3 1.2-2.3 1.2L12 15.5l-1.2-2.3L8.5 12l2.3-1.2Z" />,
  wheel: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2.4" /><path d="M12 3.5v6.1M12 14.4v6.1M3.5 12h6.1M14.4 12h6.1" /></>,
  check: <path d="M5 12.5l4.2 4.2L19 7" />,
  x: <path d="M7 7l10 10M17 7 7 17" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  star: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" fill="currentColor" stroke="none" />,
  plus: <path d="M12 5v14M5 12h14" />,
  pin: <><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" /><circle cx="12" cy="10" r="2.3" /></>,
  phone: <path d="M6.5 3.5h3l1.5 4-2 1.3a11 11 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />,
  mail: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
};

export default function Icon({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {paths[name] ?? paths.shield}
    </svg>
  );
}
