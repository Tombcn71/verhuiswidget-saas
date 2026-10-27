import { sql } from "drizzle-orm";
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
  doublePrecision,
  boolean,
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
 * Verhuizers — elk gekoppeld aan precies één Clerk-organisatie (het team).
 * Alle bedragen staan in eurocenten (integer), exclusief btw.
 */
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  // De Clerk-organisatie van dit bedrijf. Null alleen bij de demo en bij oude
  // accounts die nog niet zijn overgezet (zie `ensureLegacyOrganization`).
  clerkOrgId: text("clerk_org_id").unique(),
  // Wie het bedrijf heeft aangemaakt; zegt niets meer over toegang.
  clerkUserId: text("clerk_user_id").notNull(),

  // Abonnement. `plan`: "basic" | "standard" | "premium" (zie `lib/plans.ts`).
  // Zonder betaald abonnement geldt de proefperiode tot `trialEndsAt`.
  plan: text("plan").notNull().default("standard"),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true })
    .notNull()
    .default(sql`now() + interval '14 days'`),
  // "trialing" (proef, nog niet betaald) | "active" | "past_due" | "canceled" — bijgewerkt door de Stripe-webhook.
  subscriptionStatus: text("subscription_status").notNull().default("trialing"),
  extraSeats: integer("extra_seats").notNull().default(0), // alleen Premium
  // Laatst in Clerk gezette gebruikerslimiet; wijkt die af van het plan, dan
  // werkt de app 'm bij (zie lib/current-company#requireCompany).
  clerkSeatLimit: integer("clerk_seat_limit"),
  stripeCustomerId: text("stripe_customer_id").unique(),
  stripeSubscriptionId: text("stripe_subscription_id"),

  // Bedrijfsgegevens / white-label
  name: text("name").notNull().default("Mijn verhuisbedrijf"),
  email: text("email").notNull(),
  phone: text("phone"),
  website: text("website"),
  // Handtekening onderaan de offerte-mail aan de klant (platte tekst, met regels).
  emailSignature: text("email_signature"),
  // Vestigingsadres: start- en eindpunt voor de aan- en afrijkilometers.
  basePostcode: text("base_postcode"),
  baseHouseNumber: text("base_house_number"),
  baseAddress: text("base_address"),
  baseLat: doublePrecision("base_lat"),
  baseLon: doublePrecision("base_lon"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").notNull().default("#1a73e8"),

  // Welke dienst(en) dit bedrijf aanbiedt: "verhuizen" | "ontruimen" | "beide".
  // Stuurt de widget-toggle en het dashboard aan.
  serviceType: text("service_type").notNull().default("beide"),

  // Tarieven (eurocenten, excl. btw). Bij serviceType "beide" gelden deze voor
  // verhuizen; ontruimen krijgt een eigen set in `ontruimenTariffs`.
  baseFeeCents: integer("base_fee_cents").notNull().default(7500), // voorrijkosten
  // Rekenmethode: "uur" (verhuizers × uren × uurtarief) of "m3" (prijs per m³,
  // mankracht inbegrepen). Nooit allebei, anders telt het sjouwen dubbel.
  pricingMode: text("pricing_mode").notNull().default("uur"),
  pricePerM3Cents: integer("price_per_m3_cents").notNull().default(0), // alleen bij pricingMode "m3"
  pricePerKmCents: integer("price_per_km_cents").notNull().default(150), // per km enkele reis
  packingFeeCents: integer("packing_fee_cents").notNull().default(12000), // inpakservice
  assemblyFeeCents: integer("assembly_fee_cents").notNull().default(8000), // (de)montage
  boxPriceCents: integer("box_price_cents").notNull().default(0), // verhuisdoos per stuk; €0 = niet aangeboden
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
  truckCapacityM3: integer("truck_capacity_m3").notNull().default(40), // laadvermogen wagen; bepaalt aantal ritten
  // Tempo zoals de verhuizer het zegt: "30 m³ in 5,5 uur werk met 3 man" (zonder
  // rijden). m3PerHourPerMover hierboven wordt hieruit afgeleid bij opslaan.
  tempoM3: numeric("tempo_m3", { precision: 6, scale: 1 }).notNull().default("30"),
  tempoHours: numeric("tempo_hours", { precision: 4, scale: 1 }).notNull().default("5.5"),
  tempoMovers: integer("tempo_movers").notNull().default(3),
  // Ploeg per volume: t/m crewTwoMaxM3 2 man, t/m crewThreeMaxM3 3 man, daarboven 4.
  crewTwoMaxM3: integer("crew_two_max_m3").notNull().default(15),
  crewThreeMaxM3: integer("crew_three_max_m3").notNull().default(35),
  // Verhuiswagen als eigen regel: per "uur", "dag" of "rit". €0 = zit in het uurtarief.
  vanRateCents: integer("van_rate_cents").notNull().default(0),
  vanRateUnit: text("van_rate_unit").notNull().default("uur"),
  // Welke reistijd in de uren telt: "rit" (A → B), "loods" (vestiging → A → B →
  // vestiging) of "geen".
  travelMode: text("travel_mode").notNull().default("rit"),
  minHours: numeric("min_hours", { precision: 3, scale: 1 }).notNull().default("2"),
  roundingMinutes: integer("rounding_minutes").notNull().default(30), // 15, 30 of 60
  // Weekendtoeslag in procenten over de mankracht (en de wagen per uur).
  saturdaySurchargePct: integer("saturday_surcharge_pct").notNull().default(0),
  sundaySurchargePct: integer("sunday_surcharge_pct").notNull().default(0),

  // Verhuizen: extra toeslagen
  // Trappen tellen standaard als extra tijd (rekenmethode "uur"); de vaste
  // toeslag staat op €0, anders rekenen ze dubbel.
  stairMinutesPerFloor: integer("stair_minutes_per_floor").notNull().default(45),
  moveFloorSurchargeCents: integer("move_floor_surcharge_cents")
    .notNull()
    .default(0), // per verdieping (zonder lift), per adres
  liftFeeCents: integer("lift_fee_cents").notNull().default(15000), // verhuislift per adres
  truckAccessSurchargeCents: integer("truck_access_surcharge_cents")
    .notNull()
    .default(7500), // wagen kan niet voor de deur
  rushSurchargeCents: integer("rush_surcharge_cents").notNull().default(10000), // gewenste datum binnen 48 uur
  weekdayDiscountPct: integer("weekday_discount_pct").notNull().default(10), // ongebruikt
  moveDiscounts: jsonb("move_discounts"), // legacy, ongebruikt

  // Automatische mails aan klanten (zie lib/lead-mails.ts).
  quoteFollowUp: boolean("quote_follow_up").notNull().default(true), // herinnering als de klant niet boekt
  googleReviewUrl: text("google_review_url"), // reviewverzoek na de verhuisdatum; leeg = uit

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
    // Kanaal: "onsite" (widget op de site) | "onlink" (deel-link) | "onspot" (zelf gescand).
    source: text("source").notNull().default("onsite"),
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
    status: text("status").notNull().default("nieuw"), // nieuw | gecontacteerd | akkoord | gewonnen | verloren
    // Boekingslink in de offerte ("Ja, ik wil boeken"): geheime sleutel + moment van akkoord.
    acceptToken: text("accept_token"),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    // Automatische mails aan de klant (elk hooguit één keer).
    followUpSentAt: timestamp("follow_up_sent_at", { withTimezone: true }),
    reviewRequestSentAt: timestamp("review_request_sent_at", { withTimezone: true }),
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
  /** Verhuisdozen laten bezorgen; aantal komt uit de inboedelscan. */
  boxes?: boolean;
  storageMonths?: number;
};

export type PriceLine = {
  label: string;
  amountCents: number;
  /** Korte uitleg onder de regel, bijv. "5 uur werk + 1 uur rijden". */
  detail?: string;
};

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

/**
 * Bezoekers die de demo afronden met een echt e-mailadres (meestal verhuizers),
 * voor het overzicht op /admin. Ze krijgen geen aparte opvolgmail.
 */
export const demoLeads = pgTable("demo_leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  moveType: text("move_type").notNull(),
  totalCents: integer("total_cents").notNull(),
  // Klikte op "Ja, ik wil boeken" in de demo-mail: het warmste signaal.
  bookedAt: timestamp("booked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DemoLead = typeof demoLeads.$inferSelect;

/**
 * Verkoop-CRM van moverAI zelf (/admin): verhuisbedrijven die moverAI klant wil
 * maken. Elk krijgt een eigen demolink (/demo/<slug>); openen, afronden en
 * "boeken" in de demo worden automatisch bijgehouden.
 */
export const prospects = pgTable("prospects", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(), // in de demolink, bijv. "jansen-verhuizingen"
  companyName: text("company_name").notNull(),
  contactName: text("contact_name"),
  phone: text("phone"), // vast nummer (o.a. via Google), om te bellen
  mobile: text("mobile"), // optioneel 06-nummer uit het gesprek (om te bellen)
  email: text("email"),
  website: text("website"),
  city: text("city"),
  address: text("address"),
  // Gevonden via Google Places: ID (om dubbelen over te slaan) en beoordeling.
  placeId: text("place_id").unique(),
  rating: doublePrecision("rating"),
  reviewCount: integer("review_count"),
  notes: text("notes"),
  // nieuw | gebeld | demo_gestuurd | demo_gedaan | proef | klant | afgevallen
  stage: text("stage").notNull().default("nieuw"),
  lostReason: text("lost_reason"),
  nextAction: text("next_action"),
  nextActionOn: date("next_action_on"),
  // Automatisch bijgehouden via de demolink.
  demoSentAt: timestamp("demo_sent_at", { withTimezone: true }),
  demoOpenedAt: timestamp("demo_opened_at", { withTimezone: true }),
  demoCompletedAt: timestamp("demo_completed_at", { withTimezone: true }),
  demoBookedAt: timestamp("demo_booked_at", { withTimezone: true }),
  // Klikte op "Plan een adviesgesprek" (Calendly) in de opvolgmail.
  meetingClickedAt: timestamp("meeting_clicked_at", { withTimezone: true }),
  // Automatische opvolgmails via Resend (ingepland; ID's om te kunnen annuleren).
  reminderEmailId: text("reminder_email_id"), // "Even de demo bekijken?" (+3 dagen)
  reminderAt: timestamp("reminder_at", { withTimezone: true }),
  followUpEmailId: text("follow_up_email_id"), // "Wat vond je ervan?" (dag na de demo)
  followUpAt: timestamp("follow_up_at", { withTimezone: true }),
  autoMailOff: boolean("auto_mail_off").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Prospect = typeof prospects.$inferSelect;
export type NewProspect = typeof prospects.$inferInsert;

/**
 * Kleine sleutel/waarde-opslag voor moverAI-beheer, bijv. waar het ophalen van
 * nieuwe verhuisbedrijven via Google Places is gebleven ("places_cursor").
 */
export const adminState = pgTable("admin_state", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
