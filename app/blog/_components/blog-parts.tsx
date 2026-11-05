import Image from "next/image";
import tomImage from "@/public/tom.jpg";
import { PlanDemoButton } from "@/app/_components/plan-demo-button";

/** Gedeelde opmaak van de blogartikelen. */
export const LINK = "font-medium text-primary underline underline-offset-4";

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-12 text-2xl font-bold tracking-tight sm:text-3xl">{children}</h2>;
}

export function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-8 text-xl font-bold tracking-tight">{children}</h3>;
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-lg leading-relaxed">{children}</p>;
}

export function Wint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 rounded-xl border-l-4 border-brand-600 bg-brand-50 px-4 py-3 text-lg leading-relaxed dark:bg-brand-600/15">
      <strong>Wat je wint:</strong> {children}
    </p>
  );
}

export function BlogCta({ title, children }: { title: string; children: React.ReactNode }) {
  const calendlyUrl = process.env.CALENDLY_URL ?? null;
  return (
    <div className="mt-14 rounded-2xl bg-muted px-6 py-10 text-center">
      <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      <div className="mx-auto mt-4 max-w-xl space-y-4 text-lg leading-relaxed">{children}</div>
      <PlanDemoButton href={calendlyUrl} from="blog" className="mt-6" />
      <p className="mt-3 text-sm text-muted-foreground">15 minuten · vrijblijvend</p>
    </div>
  );
}

export function Author() {
  return (
    <div className="mt-6 flex items-center gap-3">
      <Image src={tomImage} alt="Tom van Reijn" className="size-12 rounded-full object-cover" sizes="3rem" />
      <p className="text-muted-foreground">
        <span className="font-semibold text-foreground">Tom van Reijn</span>, oprichter moverAI
        <br />
        <time dateTime="2026-11-05">5 november 2026</time>
      </p>
    </div>
  );
}

export function Table({ head, rows, boldLast = false }: { head: string[]; rows: string[][]; boldLast?: boolean }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-base sm:text-lg">
        <thead className="bg-muted">
          <tr>
            {head.map((h) => (
              <th key={h} scope="col" className="px-4 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((r, i) => (
            <tr key={r[0]} className={boldLast && i === rows.length - 1 ? "font-bold" : ""}>
              {r.map((c) => (
                <td key={c} className="px-4 py-3">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
