import { Globe, Link, MapPin, type LucideIcon } from "lucide-react";

/** De drie manieren om moverAI in te zetten; elk met een eigen pagina. */
export const SOLUTIONS: { href: string; name: string; sub: string; Icon: LucideIcon }[] = [
  { href: "/onlink", name: "Onlink", sub: "Via een linkje", Icon: Link },
  { href: "/onsite", name: "Onsite", sub: "Op je website", Icon: Globe },
  { href: "/onspot", name: "Onspot", sub: "Op locatie", Icon: MapPin },
];
