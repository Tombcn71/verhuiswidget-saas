/** Woordmerk met AI-robot-icoon. */
export function Logo({ className = "text-lg" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold tracking-tight ${className}`}
    >
      <LogoMark className="h-[1.3em] w-[1.3em] shrink-0 text-brand-600" />
      <span>
        mover<span className="text-brand-600">AI</span>
      </span>
    </span>
  );
}

/** Robot-hoofd. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M9 13v2" />
      <path d="M15 13v2" />
    </svg>
  );
}
