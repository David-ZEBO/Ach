const PATHS = {
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  level: <path d="M4 20V14M10 20V9M16 20V4M22 20H2" />,
  laptop: <><rect x="4" y="5" width="16" height="11" rx="1.5" /><path d="M2 19h20" /></>,
  book: <path d="M3 5h6a3 3 0 0 1 3 3v11a2 2 0 0 0-2-2H3zM21 5h-6a3 3 0 0 0-3 3v11a2 2 0 0 1 2-2h7z" />,
  pin: <><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2 20c.8-3.5 3.6-5.5 7-5.5s6.2 2 7 5.5" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c2 .8 3.3 2.6 4 5.2" /></>,
  spark: <path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4" />,
  tools: <path d="M14 7l3-3 3 3-3 3M17 7L7 17l-3 1 1-3L15 5" />,
  compass: <><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></>,
  flask: <path d="M9 3h6M10 3v6L4 19a1.5 1.5 0 0 0 1.3 2h13.4A1.5 1.5 0 0 0 20 19l-6-10V3" />,
  building: <path d="M3 9l9-5 9 5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18" />,
  handshake: <path d="M2 12l4-4 4 2 3-3 5 1 4 4-6 6-3-3-2 2-3-3-2 2z" />,
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  check: <path d="M5 12l4 4 10-10" />,
  cap: <><path d="M2 9l10-5 10 5-10 5z" /><path d="M6 11v5c3 2 9 2 12 0v-5" /><path d="M22 9v5" /></>,
};

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {PATHS[name]}
    </svg>
  );
}
