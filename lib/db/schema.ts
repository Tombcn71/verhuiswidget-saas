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
 * Ontruimings-extra's (eurocenten, excl. btw). Opgeslagen in jsonb
 * `companies.ontruimen_tariffs`. De basisprijs (inboedelvolume m³, verdieping,
 * lift, inpakservice) deelt de ontruiming met de verhuistarieven.
 */
export type ClearanceTariffs = {
  wallpaperPerM2Cents: number; // behang verwijderen
  holesPerUnitCents: number; // gaatjes stoppen (per stuk)
  paintPerM2Cents: number; // schilderwerk
  curtainsCents: number; // gordijnen verwijderen (vast)
  haulPerTripCents: number; // afvoer & transport per rit naar de milieustraat (incl. stortkosten)
  // Vloer verwijderen: prijs per m² per vloertype
  floorLaminaatCents: number;
  floorTapijtCents: number;
  floorPvcClickCents: number;
  floorKurkCents: number;
  floorPvcGelijmdCents: number;
  floorParketGelijmdCents: number;
  floorTegelvloerCents: number;
};

export const CLEARANCE_TARIFF_DEFAULTS: ClearanceTariffs = {
  wallpaperPerM2Cents: 400,
  holesPerUnitCents: 150,
  paintPerM2Cents: 1500,
  curtainsCents: 4000,
  haulPerTripCents: 9500,
  floorLaminaatCents: 250,
  floorTapijtCents: 300,
  floorPvcClickCents: 400,
  floorKurkCents: 400,
  floorPvcGelijmdCents: 1000,
  floorParketGelijmdCents: 1000,
  floorTegelvloerCents: 1000,
};

/** Extra antwoorden bij een verhuis-lead (jsonb `leads.move`). */
export type MoveDetails = {
  propertyType?: string; // "huis" | "appartement"
  roomCount?: number;
  hasElevator?: boolean;
  streetAccessible?: boolean;
};

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

  // Welke dienst(en) dit bedrijf aanbiedt: "verhuizen" | "ontruimen" | "beide".
  // Stuurt de widget-toggle en het dashboard aan.
  serviceType: text("service_type").notNull().default("beide"),

  // Tarieven (eurocenten, excl. btw). Bij serviceType "beide" gelden deze voor
  // verhuizen; ontruimen krijgt een eigen set in `ontruimenTariffs`.
  baseFeeCents: integer("base_fee_cents").notNull().default(35000), // voorrijkosten
  pricePerM3Cents: integer("price_per_m3_cents").notNull().default(4500), // per m³ inboedel
  pricePerKmCents: integer("price_per_km_cents").notNull().default(150), // per km enkele reis
  packingFeeCents: integer("packing_fee_cents").notNull().default(12000), // inpakservice
  assemblyFeeCents: integer("assembly_fee_cents").notNull().default(8000), // (de)montage
  storagePerMonthCents: integer("storage_per_month_cents").notNull().default(9500),
  minPriceCents: integer("min_price_cents").notNull().default(15000),
  vatRate: numeric("vat_rate", { precision: 4, scale: 3 }).notNull().default("0.210"),

  // Verhuizen: arbeid & reistijd
  hourlyRatePerMoverCents: integer("hourly_rate_per_mover_cents")
    .notNull()
    .default(4500), // uurtarief per verhuizer
  m3PerHourPerMover: numeric("m3_per_hour_per_mover", { precision: 4, scale: 1 })
    .notNull()
    .default("1.8"), // laadsnelheid: m³ per verhuizer per uur
  truckCapacityM3: integer("truck_capacity_m3").notNull().default(20), // laadvermogen wagen; bepaalt aantal ritten

  // Verhuizen: extra toeslagen
  moveFloorSurchargeCents: integer("move_floor_surcharge_cents")
    .notNull()
    .default(2500), // per verdieping (zonder lift), per adres
  liftFeeCents: integer("lift_fee_cents").notNull().default(15000), // verhuislift per adres
  truckAccessSurchargeCents: integer("truck_access_surcharge_cents")
    .notNull()
    .default(7500), // wagen kan niet voor de deur
  rushSurchargeCents: integer("rush_surcharge_cents").notNull().default(10000), // gewenste datum binnen 48 uur
  weekdayDiscountPct: integer("weekday_discount_pct").notNull().default(10), // ongebruikt
  moveDiscounts: jsonb("move_discounts"), // legacy, ongebruikt

  // Ontruimings-tarieven (m²-model). Gebruikt zodra het bedrijf ontruimt.
  ontruimenTariffs: jsonb("ontruimen_tariffs").$type<ClearanceTariffs>(),

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
    photoUrls: jsonb("photo_urls").notNull().$type<string[]>().default([]),
    totalVolumeM3: numeric("total_volume_m3", { precision: 8, scale: 2 })
      .notNull()
      .default("0"),
    options: jsonb("options").notNull().$type<LeadOptions>().default({}),

    // Gestructureerde verhuisgegevens (alleen bij moveType "verhuizing")
    move: jsonb("move").$type<MoveDetails>(),

    // Ontruimingsgegevens (alleen bij moveType "ontruiming")
    clearance: jsonb("clearance").$type<ClearanceLead>(),

    // Prijs
    priceBreakdown: jsonb("price_breakdown")
      .notNull()
      .$type<PriceLine[]>()
      .default([]),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    vatCents: integer("vat_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),

    notes: text("notes"), // interne notitie van het bedrijf
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

export type ClearanceFill = "minimaal" | "normaal" | "vol" | "overvol";

export type ClearanceItem = {
  name: string;
  quantity: number;
  size: "small" | "medium" | "large";
};

export type ClearanceWorks = {
  floorRemoval?: { type: string; m2: number } | null;
  wallpaperM2?: number;
  holes?: number;
  paintingM2?: number;
  curtains?: boolean;
  packing?: boolean;
};

/** Ontruimings-detail op een lead. */
export type ClearanceLead = {
  propertyType: string;
  roomCount: number;
  hasElevator: boolean;
  streetAccessible: boolean;
  works: ClearanceWorks;
};

export type InventoryItem = {
  name: string;
  quantity: number;
  volumeM3: number;
  category: string;
  /** Kamer waar het item is herkend (naam die de klant aan de foto gaf). */
  room?: string;
  /** Geschatte positie in de eerste foto van die kamer (fractie 0-1). */
  x?: number;
  y?: number;
  /** AI is onzeker over het formaat — widget vraagt de klant klein/normaal/groot. */
  needsInfo?: boolean;
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
