import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
  date,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

/**
 * Verhuizers — elk gekoppeld aan precies één Clerk-account.
 * Alle bedragen staan in eurocenten (integer), exclusief btw.
 */
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkUserId: text("clerk_user_id").notNull().unique(),

  // Bedrijfsgegevens / white-label
  name: text("name").notNull().default("Mijn verhuisbedrijf"),
  email: text("email").notNull(),
  phone: text("phone"),
  website: text("website"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").notNull().default("#2563eb"),

  // Tarieven (eurocenten, excl. btw)
  baseFeeCents: integer("base_fee_cents").notNull().default(35000), // voorrijkosten
  pricePerM3Cents: integer("price_per_m3_cents").notNull().default(4500), // per m³ inboedel
  pricePerKmCents: integer("price_per_km_cents").notNull().default(150), // per km enkele reis
  packingFeeCents: integer("packing_fee_cents").notNull().default(12000), // inpakservice
  assemblyFeeCents: integer("assembly_fee_cents").notNull().default(8000), // (de)montage
  storagePerMonthCents: integer("storage_per_month_cents").notNull().default(9500),
  minPriceCents: integer("min_price_cents").notNull().default(15000),
  vatRate: numeric("vat_rate", { precision: 4, scale: 3 }).notNull().default("0.210"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Binnenkomende leads / offerteaanvragen vanuit de publieke widget.
 */
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),

    // Klantgegevens
    customerName: text("customer_name").notNull(),
    customerEmail: text("customer_email").notNull(),
    customerPhone: text("customer_phone"),

    // Verhuisgegevens
    moveType: text("move_type").notNull().default("verhuizing"), // verhuizing | ontruiming
    fromAddress: text("from_address"),
    toAddress: text("to_address"),
    fromFloor: text("from_floor"),
    toFloor: text("to_floor"),
    moveDate: date("move_date"),
    distanceKm: numeric("distance_km", { precision: 7, scale: 1 }).notNull().default("0"),

    // Analyse (Gemini)
    rooms: jsonb("rooms").notNull().$type<RoomInput[]>().default([]),
    inventory: jsonb("inventory").notNull().$type<InventoryItem[]>().default([]),
    totalVolumeM3: numeric("total_volume_m3", { precision: 8, scale: 2 })
      .notNull()
      .default("0"),
    options: jsonb("options").notNull().$type<LeadOptions>().default({}),

    // Prijs
    priceBreakdown: jsonb("price_breakdown")
      .notNull()
      .$type<PriceLine[]>()
      .default([]),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    vatCents: integer("vat_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),

    status: text("status").notNull().default("nieuw"), // nieuw | gecontacteerd | gewonnen | verloren
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("leads_company_id_created_at_idx").on(t.companyId, t.createdAt.desc())],
);

// --- Gedeelde JSON-types ---

export type RoomInput = {
  name: string;
  photoCount: number;
};

export type InventoryItem = {
  name: string;
  quantity: number;
  volumeM3: number;
  category: string;
};

export type LeadOptions = {
  packing?: boolean;
  assembly?: boolean;
  storageMonths?: number;
};

export type PriceLine = {
  label: string;
  amountCents: number;
};

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
