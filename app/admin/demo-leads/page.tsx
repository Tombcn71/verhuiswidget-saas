import { listDemoLeads } from "@/lib/demo-leads";
import { formatDateTime, formatEuroCents } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Bezoekers die de algemene demo afronden met een echt e-mailadres. */
export default async function DemoLeadsPage() {
  const leads = await listDemoLeads();
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Demo-leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bezoekers van de demo op de homepage die gemaild willen worden. 🔥 = klikte ook op
          &ldquo;boeken&rdquo; in de demo-mail. Voor bedrijven die je zelf benadert: zie CRM.
        </p>
      </div>
      <Card className="py-0">
        <CardContent className="px-0">
          {leads.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Nog geen demo-leads.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Naam</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="hidden sm:table-cell">Demo</TableHead>
                  <TableHead className="pr-6 text-right">Wanneer</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="pl-6 font-medium">
                      {d.bookedAt && <span title="Klikte op boeken">🔥 </span>}
                      {d.name}
                    </TableCell>
                    <TableCell>
                      <a href={`mailto:${d.email}`} className="text-primary underline">
                        {d.email}
                      </a>
                      {d.phone && (
                        <a href={`tel:${d.phone}`} className="block text-xs text-muted-foreground">
                          {d.phone}
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="hidden capitalize text-muted-foreground sm:table-cell">
                      {d.moveType} · {formatEuroCents(d.totalCents)}
                    </TableCell>
                    <TableCell className="pr-6 text-right text-muted-foreground">
                      {formatDateTime(d.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
