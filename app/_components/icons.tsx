/** Kleine set lijn-iconen (lucide-stijl), currentColor. */

type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}>
      {children}
    </svg>
  );
}

// --- Kamer-iconen ---------------------------------------------------------

export function Sofa(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
      <path d="M2 11a2 2 0 0 1 2 2v3h16v-3a2 2 0 1 1 4 0v5a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2Z" />
      <path d="M4 18v2M20 18v2" />
    </Svg>
  );
}
export function Bed(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" />
      <path d="M6 12h4a2 2 0 0 1 2 2v0" />
    </Svg>
  );
}
export function Utensils(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 2v7c0 1.1.9 2 2 2h1a2 2 0 0 0 2-2V2M6 2v20M18 2c-1.7 0-3 1.8-3 4v6h3M18 2v20" />
    </Svg>
  );
}
export function Bath(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.7 3 4 3.7 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V12H4" />
      <path d="M2 12h20M7 19v2M17 19v2" />
    </Svg>
  );
}
export function Baby(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
      <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5S14.5 8 13 8H9.5" />
    </Svg>
  );
}
export function Briefcase(props: IconProps) {
  return (
    <Svg {...props}>
      <rect width="20" height="14" x="2" y="7" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </Svg>
  );
}
export function Boxes(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 20v-5.5l-5-3-4.03 2.42Z" />
      <path d="m7 16.5-4.74-2.85M7 16.5l5-3M7 16.5v5.17M17 12l5-3v5.5l-5 3v-5.5Z" />
      <path d="m17 12-5-3-5 3 5 3 5-3Z" />
    </Svg>
  );
}
export function Car(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.4 6c-.4-1.2-1.5-2-2.8-2H8.4c-1.3 0-2.4.8-2.8 2l-2.1 4.6C2.7 10.8 2 11.6 2 12.5V16c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
    </Svg>
  );
}
export function Trees(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z" />
      <path d="M7 16v6M13 19v3M18 12h.6a2 2 0 0 1 1.4 3.4 2 2 0 0 1-1.4 3.6H15a2 2 0 0 1-1-3.7V15a2 2 0 0 1 4-2.9V12Z" />
    </Svg>
  );
}
export function Table(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 9h18M4 9v11M20 9v11M8 9v3M16 9v3M3 6l1.5-2.5A1 1 0 0 1 5.4 3h13.2a1 1 0 0 1 .9.5L21 6" />
    </Svg>
  );
}
export function DoorOpen(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M13 4h3a2 2 0 0 1 2 2v14M2 20h20M13 20V4l-6 2v14M9 12v.01" />
    </Svg>
  );
}

export function Timer(props: IconProps) {
  return (
    <Svg {...props}>
      <line x1="10" x2="14" y1="2" y2="2" />
      <line x1="12" x2="15" y1="14" y2="11" />
      <circle cx="12" cy="14" r="8" />
    </Svg>
  );
}

export function Fuel(props: IconProps) {
  return (
    <Svg {...props}>
      <line x1="3" x2="15" y1="22" y2="22" />
      <line x1="4" x2="14" y1="9" y2="9" />
      <path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18" />
      <path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5" />
    </Svg>
  );
}

export function Truck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </Svg>
  );
}

export function TrendingDown(props: IconProps) {
  return (
    <Svg {...props}>
      <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
      <polyline points="16 17 22 17 22 11" />
    </Svg>
  );
}

export function Zap(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
    </Svg>
  );
}

export function Sparkles(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </Svg>
  );
}

export function Monitor(props: IconProps) {
  return (
    <Svg {...props}>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </Svg>
  );
}

export function Camera(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z" />
      <circle cx="12" cy="13" r="3.5" />
    </Svg>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-4.5-4.5a2 2 0 0 0-2.8 0L5 19" />
    </Svg>
  );
}
