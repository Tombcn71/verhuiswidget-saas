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
 * Ontruimings-tarieven (eurocenten, excl. btw). Opgeslagen in jsonb
 * `companies.ontruimen_tariffs`. Vulgraad-factoren zijn percentages (100 = ×1.0).
 */
export type ClearanceTariffs = {
  pricePerM2Cents: number; // basisprijs per m²
  fillFactorMinimaal: number; // %
  fillFactorNormaal: number; // %
  fillFactorVol: number; // %
  fillFactorOvervol: number; // %
  floorSurchargeCents: number; // toeslag per verdieping
  noLiftSurchargeCents: number; // extra als er geen lift is
  transportCents: number; // transport & verwerking (vast)
  minPriceCents: number;
  wallpaperPerM2Cents: number; // behang verwijderen
  holesPerM2Cents: number; // gaatjes stoppen
  paintPerM2Cents: number; // schilderwerk
  floorRemovalPerM2Cents: number; // vloer verwijderen
  curtainsCents: number; // gordijnen verwijderen (vast)
};

export const CLEARANCE_TARIFF_DEFAULTS: ClearanceTariffs = {
  pricePerM2Cents: 550,
  fillFactorMinimaal: 70,
  fillFactorNormaal: 100,
  fillFactorVol: 140,
  fillFactorOvervol: 180,
  floorSurchargeCents: 5000,
  noLiftSurchargeCents: 7500,
  transportCents: 10000,
  minPriceCents: 25000,
  wallpaperPerM2Cents: 400,
  holesPerM2Cents: 150,
  paintPerM2Cents: 1500,
  floorRemovalPerM2Cents: 800,
  curtainsCents: 4000,
};

export type MoveAddress = {
  country: string;
  postcode: string;
  houseNumber: string;
  addition: string;
  street: string;
  city: string;
  floor: number; // 0 = begane grond, -1 = souterrain
  hasLift: boolean;
  needsLiftService: boolean; // verhuislift op dit adres
  notes: string;
};

export type MoveDetails = {
  from: MoveAddress;
  to: MoveAddress;
  distanceKm: number;
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

  // Verhuizen: extra toeslagen
  moveFloorSurchargeCents: integer("move_floor_surcharge_cents")
    .notNull()
    .default(2500), // per verdieping (zonder lift), per adres
  liftFeeCents: integer("lift_fee_cents").notNull().default(15000), // verhuislift per adres
  truckAccessSurchargeCents: integer("truck_access_surcharge_cents")
    .notNull()
    .default(7500), // wagen kan niet voor de deur
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
  floorRemoval?: boolean;
  wallpaper?: boolean;
  holes?: boolean;
  painting?: boolean;
  curtains?: boolean;
};

/** Ontruimings-detail op een lead. */
export type ClearanceLead = {
  postcode: string;
  propertyType: string;
  areaM2: number;
  floor: number;
  hasLift: boolean;
  works: ClearanceWorks;
  fillLevel: ClearanceFill;
  items: ClearanceItem[];
  estimatedBoxes: number;
  specialItems: string[];
};

export type InventoryItem = {
  name: string;
  quantity: number;
  volumeM3: number;
  category: string;
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
