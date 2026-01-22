import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, appSettings } from "./models/auth";
export * from "./models/auth";

// Main categories
export const MAIN_CATEGORIES = ["Spare Parts", "Automotive"] as const;
export type MainCategory = typeof MAIN_CATEGORIES[number];

// Sub-categories for Spare Parts (car brands - no Chinese + universal parts)
export const SPARE_PARTS_SUBCATEGORIES = [
  // Part Types (shown first in dropdown)
  "Universal", "Rims", "Tires", "Turbos & Superchargers", "Lights", "Other",
  // Car brands (no Chinese)
  "Toyota", "Honda", "Nissan", "Ford", "Chevrolet", "BMW", "Mercedes", "Audi",
  "Volkswagen", "Hyundai", "Kia", "Mazda", "Mitsubishi", "Lexus", "Infiniti",
  "Land Rover", "Jeep", "Dodge", "GMC", "Porsche", "Ferrari", "Lamborghini",
  // Off-road / ATV brands
  "CAN-AM", "Polaris", "OFFROAD"
] as const;

// Sub-categories for Automotive (vehicles for sale - includes Chinese brands)
export const AUTOMOTIVE_SUBCATEGORIES = [
  // Japanese brands
  "Toyota", "Honda", "Nissan", "Mazda", "Mitsubishi", "Lexus", "Infiniti", "Subaru",
  // American brands
  "Ford", "Chevrolet", "Dodge", "Jeep", "GMC", "Cadillac",
  // German brands
  "BMW", "Mercedes", "Audi", "Volkswagen", "Porsche",
  // Korean brands
  "Hyundai", "Kia", "Genesis",
  // British brands
  "Land Rover", "Jaguar", "Bentley", "Rolls Royce",
  // Italian brands
  "Ferrari", "Lamborghini", "Maserati", "Alfa Romeo",
  // Chinese brands
  "BYD", "Chery", "Geely", "Great Wall", "MG", "NIO", "XPeng", "Li Auto", "Haval",
  // Off-road / ATV brands
  "CAN-AM", "Polaris", "OFFROAD",
  // Other
  "Motorcycles", "Other"
] as const;

// Car models by brand (for Automotive filtering)
export const CAR_MODELS: Record<string, string[]> = {
  "Toyota": [
    "Camry", "Camry Hybrid", "Corolla", "Corolla Cross", "Land Cruiser", "Land Cruiser 70", "Land Cruiser 200", "Land Cruiser 300",
    "Prado", "Prado VX", "RAV4", "RAV4 Hybrid", "Hilux", "Hilux Revo", "Yaris", "Yaris Cross", "Supra", "Supra GR",
    "Fortuner", "Fortuner Legender", "Avalon", "86", "GR86", "Crown", "Sequoia", "Tundra", "4Runner", "Tacoma",
    "Sienna", "Venza", "Highlander", "C-HR", "bZ4X", "FJ Cruiser", "Granvia", "Previa", "Innova", "Rush", "Avanza"
  ],
  "Honda": [
    "Civic", "Civic Si", "Civic Type R", "Accord", "Accord Hybrid", "CR-V", "CR-V Hybrid", "HR-V", "Pilot", "Pilot TrailSport",
    "Odyssey", "City", "Jazz", "Fit", "Passport", "Ridgeline", "Element", "Insight", "S2000", "NSX",
    "Prelude", "Integra", "CR-Z", "ZR-V", "Vezel", "BR-V", "WR-V", "Freed", "Stepwgn"
  ],
  "Nissan": [
    "Altima", "Maxima", "Patrol", "Patrol Safari", "Patrol Super Safari", "Patrol Nismo", "Patrol Platinum",
    "X-Trail", "Sentra", "370Z", "350Z", "GT-R", "GT-R Nismo", "GT-R Premium", "Pathfinder", "Kicks",
    "Rogue", "Murano", "Armada", "Titan", "Titan XD", "Frontier", "Juke", "Leaf", "Ariya",
    "Navara", "Sunny", "Tiida", "Qashqai", "Terra", "Urvan", "Z"
  ],
  "Mazda": [
    "Mazda2", "Mazda3", "Mazda3 Turbo", "Mazda6", "Mazda6 Signature", "CX-3", "CX-30", "CX-30 Turbo",
    "CX-5", "CX-5 Turbo", "CX-50", "CX-60", "CX-70", "CX-9", "CX-90", "MX-5 Miata", "MX-5 RF", "MX-30", "BT-50"
  ],
  "Mitsubishi": [
    "Pajero", "Pajero Sport", "Pajero Evolution", "Outlander", "Outlander PHEV", "Outlander Sport",
    "Lancer", "Lancer Evolution", "Lancer Evolution X", "Eclipse", "Eclipse Cross", "ASX",
    "Montero", "Montero Sport", "L200", "Triton", "Mirage", "Attrage", "Delica", "Xpander", "Xpander Cross"
  ],
  "Lexus": [
    "ES 250", "ES 300h", "ES 350", "GS 350", "GS F", "IS 200t", "IS 300", "IS 350", "IS 500", "IS F",
    "LS 500", "LS 500h", "LX 570", "LX 600", "RX 350", "RX 350h", "RX 450h", "RX 500h",
    "NX 250", "NX 350", "NX 350h", "NX 450h+", "GX 460", "GX 550", "LC 500", "LC 500h",
    "RC 300", "RC 350", "RC F", "UX 200", "UX 250h", "LM 300h", "LM 350h", "TX 350", "TX 500h"
  ],
  "Infiniti": [
    "Q50", "Q50 Red Sport 400", "Q60", "Q60 Red Sport 400", "Q70", "Q70L",
    "QX50", "QX55", "QX60", "QX80", "QX80 ProACTIVE",
    "G35", "G37", "G37 Coupe", "M35", "M37", "M56", "FX35", "FX37", "FX50", "EX35", "JX35"
  ],
  "Subaru": [
    "Impreza", "Impreza WRX", "WRX", "WRX STI", "Outback", "Outback Wilderness", "Forester", "Forester Wilderness",
    "Legacy", "Legacy GT", "BRZ", "BRZ tS", "Crosstrek", "Crosstrek Wilderness", "Ascent", "XV", "Levorg", "Solterra"
  ],
  "Ford": [
    "Mustang", "Mustang GT", "Mustang EcoBoost", "Mustang Shelby GT350", "Mustang Shelby GT500", "Mustang Mach-E", "Mustang Dark Horse",
    "F-150", "F-150 XLT", "F-150 Lariat", "F-150 Platinum", "F-150 Raptor", "F-150 Lightning", "F-250", "F-250 Super Duty", "F-350", "F-450",
    "Explorer", "Explorer ST", "Explorer Limited", "Expedition", "Expedition Max", "Expedition King Ranch",
    "Edge", "Edge ST", "Edge Titanium", "Escape", "Escape Hybrid", "Ranger", "Ranger Raptor", "Ranger Wildtrak",
    "Bronco", "Bronco Sport", "Bronco Raptor", "Bronco Badlands", "Maverick", "Maverick Hybrid",
    "Focus", "Focus RS", "Focus ST", "Fiesta", "Fiesta ST", "Fusion", "Taurus", "Taurus SHO",
    "GT", "EcoSport", "Everest", "Territory", "Transit", "E-Series"
  ],
  "Chevrolet": [
    "Camaro", "Camaro LT", "Camaro SS", "Camaro ZL1", "Camaro 1LE", "Corvette", "Corvette Stingray", "Corvette Z06", "Corvette ZR1", "Corvette E-Ray",
    "Tahoe", "Tahoe Z71", "Tahoe High Country", "Suburban", "Suburban Premier",
    "Silverado 1500", "Silverado 1500 LT", "Silverado 1500 RST", "Silverado 1500 High Country", "Silverado ZR2", "Silverado 2500HD", "Silverado 3500HD",
    "Colorado", "Colorado Z71", "Colorado ZR2", "Traverse", "Traverse RS", "Equinox", "Equinox RS",
    "Blazer", "Blazer RS", "Blazer EV", "Trailblazer", "Trailblazer RS", "Trax", "Malibu", "Bolt EV", "Bolt EUV"
  ],
  "Dodge": [
    "Challenger", "Challenger SXT", "Challenger R/T", "Challenger R/T Scat Pack", "Challenger SRT Hellcat", "Challenger SRT Demon",
    "Charger", "Charger SXT", "Charger R/T", "Charger R/T Scat Pack", "Charger SRT Hellcat", "Charger Daytona",
    "Durango", "Durango GT", "Durango R/T", "Durango SRT", "Durango SRT Hellcat", "Hornet", "Journey"
  ],
  "Jeep": [
    "Wrangler", "Wrangler Sport", "Wrangler Sahara", "Wrangler Rubicon", "Wrangler 4xe", "Wrangler Unlimited", "Wrangler 392",
    "Grand Cherokee", "Grand Cherokee L", "Grand Cherokee 4xe", "Grand Cherokee Summit", "Grand Cherokee SRT", "Grand Cherokee Trackhawk",
    "Cherokee", "Cherokee Trailhawk", "Cherokee Limited", "Compass", "Compass Trailhawk", "Renegade", "Renegade Trailhawk",
    "Gladiator", "Gladiator Rubicon", "Gladiator Mojave", "Grand Wagoneer", "Wagoneer", "Commander"
  ],
  "GMC": [
    "Sierra 1500", "Sierra 1500 SLE", "Sierra 1500 SLT", "Sierra 1500 AT4", "Sierra 1500 Denali", "Sierra 2500HD", "Sierra 3500HD",
    "Yukon", "Yukon SLE", "Yukon SLT", "Yukon AT4", "Yukon Denali", "Yukon XL",
    "Terrain", "Terrain SLE", "Terrain AT4", "Terrain Denali", "Acadia", "Acadia AT4", "Acadia Denali",
    "Canyon", "Canyon AT4", "Canyon Denali", "Hummer EV", "Hummer EV SUV"
  ],
  "Cadillac": [
    "Escalade", "Escalade ESV", "Escalade V", "Escalade Sport", "Escalade Premium Luxury",
    "CT4", "CT4 Luxury", "CT4-V", "CT4-V Blackwing", "CT5", "CT5 Luxury", "CT5-V", "CT5-V Blackwing",
    "XT4", "XT4 Luxury", "XT4 Sport", "XT5", "XT5 Luxury", "XT6", "XT6 Luxury", "Lyriq", "Celestiq"
  ],
  "BMW": [
    "118i", "120i", "M135i", "220i", "230i", "M240i", "M2", "M2 Competition",
    "320i", "330i", "330e", "340i", "M3", "M3 Competition", "M3 CS",
    "420i", "430i", "440i", "M4", "M4 Competition", "M4 CSL",
    "520i", "530i", "530e", "540i", "M5", "M5 Competition", "M5 CS",
    "630i", "640i", "650i", "M6", "740i", "750i", "760i", "M760i",
    "840i", "850i", "M8", "M8 Competition", "M8 Gran Coupe",
    "X1", "X1 sDrive", "X2", "X3", "X3 M", "X3 M Competition", "X4", "X4 M",
    "X5", "X5 M", "X5 M Competition", "X6", "X6 M", "X7", "XM", "Z4", "Z4 M40i",
    "i3", "i4", "i4 M50", "i5", "i7", "iX", "iX M60", "iX1", "iX3"
  ],
  "Mercedes": [
    "A 180", "A 200", "A 250", "A 35 AMG", "A 45 AMG",
    "C 180", "C 200", "C 300", "C 43 AMG", "C 63 AMG", "C 63 S AMG",
    "E 200", "E 300", "E 350", "E 450", "E 53 AMG", "E 63 AMG", "E 63 S AMG",
    "S 450", "S 500", "S 580", "S 63 AMG", "S 680 Maybach",
    "CLA 180", "CLA 200", "CLA 250", "CLA 35 AMG", "CLA 45 AMG",
    "CLS 450", "CLS 53 AMG", "GLA 200", "GLA 250", "GLA 35 AMG", "GLA 45 AMG",
    "GLB 200", "GLB 250", "GLB 35 AMG", "GLC 200", "GLC 300", "GLC 43 AMG", "GLC 63 AMG",
    "GLE 350", "GLE 450", "GLE 53 AMG", "GLE 63 AMG", "GLE 63 S AMG",
    "GLS 450", "GLS 580", "GLS 63 AMG", "GLS 600 Maybach",
    "G 500", "G 550", "G 63 AMG", "G 63 AMG 4x4²",
    "AMG GT 43", "AMG GT 53", "AMG GT 63", "AMG GT R", "AMG GT Black Series",
    "EQA", "EQB", "EQC", "EQE", "EQE SUV", "EQS", "EQS SUV", "EQV"
  ],
  "Audi": [
    "A1 Sportback", "A3", "A3 Sportback", "S3", "RS3",
    "A4", "A4 Avant", "S4", "RS4", "RS4 Avant", "A5", "A5 Sportback", "S5", "RS5",
    "A6", "A6 Avant", "A6 Allroad", "S6", "RS6", "RS6 Avant",
    "A7", "S7", "RS7", "A8", "A8 L", "S8",
    "Q2", "Q3", "Q3 Sportback", "RSQ3", "Q4 e-tron", "Q5", "Q5 Sportback", "SQ5",
    "Q7", "SQ7", "Q8", "SQ8", "RSQ8", "Q8 e-tron",
    "e-tron", "e-tron GT", "RS e-tron GT", "R8", "R8 Spyder", "R8 V10", "TT", "TTS", "TT RS"
  ],
  "Volkswagen": [
    "Golf", "Golf GTI", "Golf R", "Golf GTE", "Polo", "Polo GTI",
    "Passat", "Passat Variant", "Jetta", "Jetta GLI", "Arteon", "Arteon R",
    "Tiguan", "Tiguan R", "Tiguan Allspace", "Touareg", "Touareg R",
    "Atlas", "Atlas Cross Sport", "Taos", "T-Roc", "T-Cross",
    "ID.3", "ID.4", "ID.5", "ID.7", "ID.Buzz", "Amarok", "Transporter", "Multivan"
  ],
  "Porsche": [
    "911 Carrera", "911 Carrera S", "911 Carrera 4S", "911 Targa", "911 Turbo", "911 Turbo S",
    "911 GT3", "911 GT3 RS", "911 GT3 Touring", "911 GT2 RS", "911 Dakar", "911 Sport Classic",
    "718 Boxster", "718 Boxster S", "718 Boxster GTS", "718 Spyder",
    "718 Cayman", "718 Cayman S", "718 Cayman GTS", "718 Cayman GT4", "718 Cayman GT4 RS",
    "Cayenne", "Cayenne S", "Cayenne GTS", "Cayenne Turbo", "Cayenne Turbo GT", "Cayenne E-Hybrid",
    "Macan", "Macan S", "Macan GTS", "Macan Turbo", "Macan EV",
    "Panamera", "Panamera 4S", "Panamera GTS", "Panamera Turbo", "Panamera Turbo S",
    "Taycan", "Taycan 4S", "Taycan GTS", "Taycan Turbo", "Taycan Turbo S", "Taycan Cross Turismo"
  ],
  "Hyundai": [
    "Elantra", "Elantra N", "Elantra Hybrid", "Elantra N Line", "Sonata", "Sonata N Line", "Sonata Hybrid", "Azera",
    "Tucson", "Tucson Hybrid", "Tucson N Line", "Santa Fe", "Santa Fe Hybrid", "Santa Fe Calligraphy",
    "Palisade", "Palisade Calligraphy", "Kona", "Kona N", "Kona Electric", "Venue", "Creta",
    "Ioniq 5", "Ioniq 5 N", "Ioniq 6", "Nexo", "Veloster", "Veloster N", "i30", "i30 N", "Staria"
  ],
  "Kia": [
    "Forte", "Forte GT", "K5", "K5 GT", "K8", "K9", "Stinger", "Stinger GT",
    "Sportage", "Sportage Hybrid", "Sportage X-Pro", "Sorento", "Sorento Hybrid", "Sorento X-Line",
    "Telluride", "Telluride X-Pro", "Telluride SX", "Soul", "Seltos", "Niro", "Niro EV", "Niro Hybrid",
    "EV6", "EV6 GT", "EV9", "Carnival", "Carnival SX", "Rio", "Ceed", "ProCeed", "XCeed"
  ],
  "Genesis": [
    "G70", "G70 Sport", "G80", "G80 Sport", "G80 EV", "G90", "G90 Long Wheelbase",
    "GV60", "GV70", "GV70 Sport", "GV70 EV", "GV80", "GV80 Coupe"
  ],
  "Land Rover": [
    "Range Rover", "Range Rover LWB", "Range Rover SV", "Range Rover Autobiography", "Range Rover First Edition",
    "Range Rover Sport", "Range Rover Sport SV", "Range Rover Sport Autobiography", "Range Rover Sport HSE",
    "Range Rover Velar", "Range Rover Velar R-Dynamic", "Range Rover Evoque", "Range Rover Evoque R-Dynamic",
    "Discovery", "Discovery Metropolitan", "Discovery Sport", "Discovery Sport R-Dynamic",
    "Defender 90", "Defender 110", "Defender 130", "Defender V8", "Defender X"
  ],
  "Jaguar": [
    "F-Type", "F-Type R", "F-Type SVR", "F-Type P450",
    "XE", "XE S", "XE R-Dynamic", "XF", "XF S", "XF R-Dynamic",
    "F-Pace", "F-Pace S", "F-Pace R-Dynamic", "F-Pace SVR",
    "E-Pace", "E-Pace R-Dynamic", "I-Pace", "I-Pace HSE"
  ],
  "Bentley": [
    "Continental GT", "Continental GT V8", "Continental GT Speed", "Continental GT Mulliner", "Continental GT Azure",
    "Continental GTC", "Continental GTC V8", "Continental GTC Speed",
    "Flying Spur", "Flying Spur V8", "Flying Spur Speed", "Flying Spur Mulliner", "Flying Spur Hybrid",
    "Bentayga", "Bentayga V8", "Bentayga Speed", "Bentayga S", "Bentayga EWB", "Bentayga Hybrid", "Bentayga Azure"
  ],
  "Rolls Royce": [
    "Phantom", "Phantom Extended", "Phantom Series II",
    "Ghost", "Ghost Extended", "Ghost Black Badge", "Ghost Series II",
    "Wraith", "Wraith Black Badge", "Dawn", "Dawn Black Badge",
    "Cullinan", "Cullinan Black Badge", "Spectre"
  ],
  "Ferrari": [
    "488 GTB", "488 Spider", "488 Pista", "488 Pista Spider",
    "F8 Tributo", "F8 Spider", "812 Superfast", "812 GTS", "812 Competizione",
    "Roma", "Roma Spider", "Portofino", "Portofino M",
    "SF90 Stradale", "SF90 Spider", "SF90 XX", "296 GTB", "296 GTS",
    "Purosangue", "Daytona SP3", "LaFerrari"
  ],
  "Lamborghini": [
    "Huracan EVO", "Huracan EVO Spyder", "Huracan STO", "Huracan Tecnica", "Huracan Sterrato",
    "Aventador S", "Aventador SVJ", "Aventador Ultimae",
    "Urus", "Urus S", "Urus Performante", "Revuelto", "Countach LPI 800-4"
  ],
  "Maserati": [
    "Ghibli", "Ghibli Modena", "Ghibli Trofeo", "Quattroporte", "Quattroporte Modena", "Quattroporte Trofeo",
    "Levante", "Levante Modena", "Levante Trofeo", "GranTurismo", "GranTurismo Folgore",
    "GranCabrio", "MC20", "MC20 Cielo", "Grecale", "Grecale Modena", "Grecale Trofeo", "Grecale Folgore"
  ],
  "Alfa Romeo": [
    "Giulia", "Giulia Ti", "Giulia Veloce", "Giulia Quadrifoglio",
    "Stelvio", "Stelvio Ti", "Stelvio Veloce", "Stelvio Quadrifoglio",
    "Tonale", "Tonale Veloce", "Tonale PHEV"
  ],
  "BYD": [
    "Tang", "Tang EV", "Han", "Han EV", "Seal", "Seal U", "Dolphin", "Dolphin Mini",
    "Atto 3", "Song Plus", "Song Pro", "Yuan Plus", "Qin Plus", "Destroyer 05", "Seagull"
  ],
  "Chery": [
    "Tiggo 2", "Tiggo 2 Pro", "Tiggo 4", "Tiggo 4 Pro", "Tiggo 5x", "Tiggo 7", "Tiggo 7 Pro",
    "Tiggo 8", "Tiggo 8 Pro", "Tiggo 8 Pro Max", "Arrizo 5", "Arrizo 6", "Arrizo 8", "Omoda 5"
  ],
  "Geely": [
    "Coolray", "Coolray Sport", "Azkarra", "Okavango", "Emgrand", "Emgrand GT",
    "Tugella", "Monjaro", "Boyue", "Atlas", "Zeekr 001", "Zeekr 009"
  ],
  "Great Wall": [
    "Haval H6", "Haval H6 GT", "Haval H9", "Haval Jolion", "Haval Dargo",
    "Poer", "Tank 300", "Tank 500", "ORA Good Cat", "ORA Funky Cat", "Wey Coffee 01"
  ],
  "MG": [
    "ZS", "ZS EV", "HS", "HS PHEV", "MG5", "MG5 EV", "MG6", "MG7", "RX5", "RX8",
    "Marvel R", "Cyberster", "MG4 EV", "MG One", "Extender"
  ],
  "NIO": [
    "ES6", "ES7", "ES8", "ET5", "ET5 Touring", "ET7", "EC6", "EC7", "EL7", "EL8", "EP9"
  ],
  "XPeng": [
    "P7", "P7i", "G3", "G3i", "P5", "G6", "G9", "X9"
  ],
  "Li Auto": [
    "L6", "L7", "L7 Pro", "L7 Max", "L8", "L8 Pro", "L8 Max", "L9", "L9 Pro", "L9 Max", "Mega"
  ],
  "Haval": [
    "H1", "H2", "H4", "H5", "H6", "H6 GT", "H6 Hybrid", "H7", "H8", "H9", "Jolion", "Jolion HEV", "Dargo"
  ],
};

// Listing status for moderation
export const LISTING_STATUS = ["pending", "approved", "rejected"] as const;
export type ListingStatus = typeof LISTING_STATUS[number];

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price"), // in cents - optional now
  imageUrl: text("image_url").notNull(), // Primary image (first image)
  imageUrls: text("image_urls").array(), // Additional images (up to 20 total)
  mainCategory: text("main_category").notNull(), // "Spare Parts" or "Automotive"
  subCategory: text("sub_category").notNull(), // Toyota, Honda, Turbos, Motorcycles, etc.
  model: text("model"), // Car model (e.g., Corvette, F-150) - optional
  condition: text("condition"), // New, Used, Refurbished - optional
  sellerId: varchar("seller_id").notNull().references(() => users.id),
  location: text("location"),
  phoneNumber: text("phone_number"),
  whatsappNumber: text("whatsapp_number"),
  // Automotive-specific fields
  mileage: integer("mileage"), // in kilometers
  year: integer("year"), // manufacture year
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),
  expiresAt: timestamp("expires_at"), // Set to 1 month after approval
  createdAt: timestamp("created_at").defaultNow(),
});

// Favorites table for saved items
export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Banners for homepage carousel (admin-controlled)
export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"), // Optional link when clicked
  buttonText: text("button_text"), // e.g. "View Offers"
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subscription packages (admin-configurable)
export const subscriptionPackages = pgTable("subscription_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(), // in AED (not cents for simplicity)
  credits: integer("credits").notNull(),
  bonusCredits: integer("bonus_credits").default(0).notNull(), // e.g. "8+2 free" would be credits=8, bonusCredits=2
  category: text("category").notNull(), // "Spare Parts" or "Automotive"
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment transactions for revenue tracking
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  packageId: integer("package_id").references(() => subscriptionPackages.id),
  amount: integer("amount").notNull(), // in AED
  credits: integer("credits").notNull(), // Total credits given (including bonus)
  category: text("category").notNull(), // "Spare Parts" or "Automotive"
  paymentMethod: text("payment_method"), // "apple_pay", "credit_card"
  paymentReference: text("payment_reference"), // Telr transaction reference
  status: text("status").default("completed").notNull(), // "pending", "completed", "failed"
  createdAt: timestamp("created_at").defaultNow(),
});

// Track user views for "For You" recommendations
export const userViews = pgTable("user_views", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id), // Can be null for anonymous
  sessionId: text("session_id"), // For anonymous users
  productId: integer("product_id").notNull().references(() => products.id),
  mainCategory: text("main_category"),
  subCategory: text("sub_category"),
  viewedAt: timestamp("viewed_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  sellerId: true, // Derived from auth
  status: true, // Set by system
  rejectionReason: true, // Set by admin
  expiresAt: true, // Set when approved
}).extend({
  mileage: z.number().optional(),
  year: z.number().optional(),
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
  userId: true, // Derived from auth
});

export const insertBannerSchema = createInsertSchema(banners).omit({
  id: true,
  createdAt: true,
});

export const insertUserViewSchema = createInsertSchema(userViews).omit({
  id: true,
  viewedAt: true,
});

export const insertSubscriptionPackageSchema = createInsertSchema(subscriptionPackages).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // listing_approved, listing_rejected, credit_added, etc.
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  relatedId: integer("related_id"), // product id, transaction id, etc.
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  isRead: true,
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Banner = typeof banners.$inferSelect;
export type InsertBanner = z.infer<typeof insertBannerSchema>;
export type UserView = typeof userViews.$inferSelect;
export type InsertUserView = z.infer<typeof insertUserViewSchema>;
export type SubscriptionPackage = typeof subscriptionPackages.$inferSelect;
export type InsertSubscriptionPackage = z.infer<typeof insertSubscriptionPackageSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type AppSettings = typeof appSettings.$inferSelect;
export type { OtpCode } from "./models/auth";
export { otpCodes } from "./models/auth";
