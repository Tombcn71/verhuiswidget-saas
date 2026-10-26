/**
 * Zwevende WhatsApp-knop naar moverAI (helpdesk). Gewone wa.me-link, geen
 * extern script. Verborgen zolang `WHATSAPP_NUMBER` niet is ingesteld.
 */
export function WhatsAppButton({ message = "Hoi, ik heb een vraag over moverAI" }: { message?: string }) {
  const href = whatsAppUrl(message);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label="Stel je vraag via WhatsApp"
      title="Stel je vraag via WhatsApp"
      className="fixed right-5 bottom-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:bg-[#1ebe5b] print:hidden"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-7">
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35ZM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.39 9.39 0 0 1-1.44-5.01c0-5.19 4.23-9.42 9.43-9.42a9.36 9.36 0 0 1 6.66 2.76 9.36 9.36 0 0 1 2.76 6.67c0 5.2-4.23 9.42-9.43 9.42Zm8.02-17.44A11.27 11.27 0 0 0 12.05.75C5.8.75.72 5.83.72 12.08c0 2 .52 3.95 1.52 5.67L.62 23.25l5.63-1.48a11.3 11.3 0 0 0 5.8 1.48h.01c6.25 0 11.33-5.08 11.33-11.33 0-3.03-1.18-5.87-3.32-8.01Z" />
      </svg>
    </a>
  );
}

/** wa.me-link; accepteert 06…, +316… of 316… in `WHATSAPP_NUMBER`. */
function whatsAppUrl(message: string): string | null {
  const digits = process.env.WHATSAPP_NUMBER?.replace(/\D/g, "");
  if (!digits) return null;
  const number = digits.startsWith("0") ? `31${digits.slice(1)}` : digits;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
