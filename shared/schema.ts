import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users, appSettings } from "./models/auth";
export * from "./models/auth";

// Main categories
export const MAIN_CATEGORIES = ["Spare Parts", "Automotive"] as const;
export type MainCategory = typeof MAIN_CATEGORIES[number];

// Sub-categories for Spare Parts (car brands - no Chinese + universal parts)
// Part types first, then "Other", then car brands alphabetically
export const SPARE_PARTS_SUBCATEGORIES = [
  // Part Types (shown first)
  "Universal", "Rims", "Tires", "Turbos & Superchargers", "Lights",
  // Other
  "Other",
  // Car brands alphabetically
  "Acura", "Audi", "BMW", "CAN-AM", "Chevrolet", "Dodge", "Fiat", "Ferrari", "Ford", "GMC",
  "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep", "Kia", "Lamborghini", "Land Rover",
  "Lexus", "Lincoln", "Mazda", "Mercedes", "Mini", "Mitsubishi", "Nissan", "OFFROAD", "Peugeot", "Polaris",
  "Porsche", "Renault", "Rolls Royce", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo"
] as const;

// Sub-categories for Automotive (vehicles for sale - includes Chinese brands)
// Alphabetical order
export const AUTOMOTIVE_SUBCATEGORIES = [
  "Acura", "Alfa Romeo", "Audi", "Bentley", "BMW", "BYD", "Cadillac", "CAN-AM", "Chery",
  "Chevrolet", "Citroen", "Dodge", "Ferrari", "Fiat", "Ford", "Geely", "Genesis", "GMC", "Great Wall",
  "Haval", "Honda", "Hyundai", "Infiniti", "Jaguar", "Jeep", "Jetour", "Kia", "Lamborghini",
  "Land Rover", "Lexus", "Li Auto", "Lincoln", "Maserati", "Mazda", "Mercedes", "MG",
  "Mini", "Mitsubishi", "Motorcycles", "NIO", "Nissan", "OFFROAD", "Other", "Peugeot", "Polaris",
  "Porsche", "Renault", "Rolls Royce", "Rox", "Subaru", "Suzuki", "Tesla", "Toyota", "Volkswagen", "Volvo", "XPeng"
] as const;

// Car models by brand (for Automotive filtering)
export const CAR_MODELS: Record<string, string[]> = {
  "Toyota": [
    "Camry", "Camry Hybrid", "Camry Grande", "Camry SE", "Camry XSE",
    "Corolla", "Corolla Cross", "Corolla Hatchback", "Corolla GR",
    "Land Cruiser", "Land Cruiser 70", "Land Cruiser 80", "Land Cruiser 100", "Land Cruiser 200", "Land Cruiser 300",
    "Land Cruiser GXR", "Land Cruiser VXR", "Land Cruiser GR Sport",
    "Prado", "Prado VX", "Prado TX", "Prado TXL",
    "RAV4", "RAV4 Hybrid", "RAV4 Prime", "RAV4 Adventure",
    "Hilux", "Hilux Revo", "Hilux SR5", "Hilux GR Sport",
    "Yaris", "Yaris Cross", "Yaris GR", "Supra", "Supra GR", "Supra A80",
    "Fortuner", "Fortuner Legender", "Fortuner GR Sport",
    "Avalon", "Avalon Touring", "86", "GR86", "Crown", "Crown Signia",
    "Sequoia", "Sequoia TRD Pro", "Tundra", "Tundra TRD Pro", "4Runner", "4Runner TRD Pro",
    "Tacoma", "Tacoma TRD", "Sienna", "Venza", "Highlander", "C-HR", "bZ4X",
    "FJ Cruiser", "Granvia", "Previa", "Innova", "Rush", "Avanza",
    "Cressida", "Celica", "MR2", "Tercel", "Starlet", "Land Cruiser Pick Up",
    "Veloz", "Urban Cruiser", "Crown Crossover", "Coaster"
  ],
  "Honda": [
    "Civic", "Civic Si", "Civic Type R", "Accord", "Accord Hybrid", "CR-V", "CR-V Hybrid", "HR-V", "Pilot", "Pilot TrailSport",
    "Odyssey", "City", "Jazz", "Fit", "Passport", "Ridgeline", "Element", "Insight", "S2000", "NSX",
    "Prelude", "Integra", "CR-Z", "ZR-V", "Vezel", "BR-V", "WR-V", "Freed", "Stepwgn",
    "Prologue", "Prologue EV", "Brio", "Amaze", "Mobilio", "N-Box"
  ],
  "Nissan": [
    "Altima", "Altima SR", "Maxima", "Maxima SR",
    "Patrol", "Patrol Safari", "Patrol Super Safari", "Patrol Nismo", "Patrol Platinum", "Patrol LE", "Patrol SE", "Patrol XE",
    "Patrol Y61", "Patrol Y62", "Patrol V6", "Patrol V8",
    "X-Trail", "X-Trail e-Power", "Sentra", "370Z", "370Z Nismo", "350Z", "300ZX", "240SX", "Silvia",
    "GT-R", "GT-R Nismo", "GT-R Premium", "GT-R T-Spec", "GT-R R34", "GT-R R33", "GT-R R32", "Skyline",
    "Pathfinder", "Pathfinder Rock Creek", "Kicks", "Kicks e-Power",
    "Rogue", "Murano", "Armada", "Armada Platinum",
    "Titan", "Titan XD", "Frontier", "Juke", "Juke Nismo", "Leaf", "Ariya",
    "Navara", "Sunny", "Tiida", "Qashqai", "Terra", "Urvan", "Z", "Z Nismo",
    "Note", "Note e-Power", "Micra", "Versa", "Xterra", "Safari", "Datsun",
    "Magnite", "Interstar", "Patrol Pickup"
  ],
  "Mazda": [
    "Mazda2", "Mazda3", "Mazda3 Turbo", "Mazda6", "Mazda6 Signature", "CX-3", "CX-30", "CX-30 Turbo",
    "CX-5", "CX-5 Turbo", "CX-50", "CX-60", "CX-70", "CX-9", "CX-90", "MX-5 Miata", "MX-5 RF", "MX-30", "BT-50",
    "RX-7", "RX-8", "323", "626", "MX-3", "MX-6", "MPV", "Tribute"
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
    "GT", "EcoSport", "Everest", "Territory", "Transit", "E-Series",
    "Crown Victoria", "Flex", "Excursion", "F-150 King Ranch", "Puma", "Kuga"
  ],
  "Chevrolet": [
    "Camaro", "Camaro LT", "Camaro SS", "Camaro ZL1", "Camaro 1LE", "Corvette", "Corvette Stingray", "Corvette Z06", "Corvette ZR1", "Corvette E-Ray",
    "Tahoe", "Tahoe Z71", "Tahoe High Country", "Suburban", "Suburban Premier",
    "Silverado 1500", "Silverado 1500 LT", "Silverado 1500 RST", "Silverado 1500 High Country", "Silverado ZR2", "Silverado 2500HD", "Silverado 3500HD",
    "Colorado", "Colorado Z71", "Colorado ZR2", "Traverse", "Traverse RS", "Equinox", "Equinox RS",
    "Blazer", "Blazer RS", "Blazer EV", "Trailblazer", "Trailblazer RS", "Trax", "Malibu", "Bolt EV", "Bolt EUV",
    "Captiva", "Spark", "Groove", "Menlo", "Impala", "SS", "Monte Carlo", "El Camino"
  ],
  "Dodge": [
    "Challenger", "Challenger SXT", "Challenger R/T", "Challenger R/T Scat Pack", "Challenger SRT Hellcat", "Challenger SRT Demon",
    "Charger", "Charger SXT", "Charger R/T", "Charger R/T Scat Pack", "Charger SRT Hellcat", "Charger Daytona",
    "Durango", "Durango GT", "Durango R/T", "Durango SRT", "Durango SRT Hellcat", "Hornet", "Journey",
    "Viper", "Viper ACR", "Viper GTS", "Ram 1500", "Ram 1500 TRX", "Ram 2500", "Ram 3500", "Neon", "Dart"
  ],
  "Jeep": [
    "Wrangler", "Wrangler Sport", "Wrangler Sahara", "Wrangler Rubicon", "Wrangler 4xe", "Wrangler Unlimited", "Wrangler 392",
    "Grand Cherokee", "Grand Cherokee L", "Grand Cherokee 4xe", "Grand Cherokee Summit", "Grand Cherokee SRT", "Grand Cherokee Trackhawk",
    "Cherokee", "Cherokee Trailhawk", "Cherokee Limited", "Compass", "Compass Trailhawk", "Renegade", "Renegade Trailhawk",
    "Gladiator", "Gladiator Rubicon", "Gladiator Mojave", "Grand Wagoneer", "Wagoneer", "Commander",
    "Avenger", "Recon"
  ],
  "GMC": [
    "Sierra 1500", "Sierra 1500 SLE", "Sierra 1500 SLT", "Sierra 1500 AT4", "Sierra 1500 Denali", "Sierra 2500HD", "Sierra 3500HD",
    "Yukon", "Yukon SLE", "Yukon SLT", "Yukon AT4", "Yukon Denali", "Yukon XL",
    "Terrain", "Terrain SLE", "Terrain AT4", "Terrain Denali", "Acadia", "Acadia AT4", "Acadia Denali",
    "Canyon", "Canyon AT4", "Canyon Denali", "Hummer EV", "Hummer EV SUV",
    "Envoy", "Savana"
  ],
  "Cadillac": [
    "Escalade", "Escalade ESV", "Escalade V", "Escalade Sport", "Escalade Premium Luxury",
    "CT4", "CT4 Luxury", "CT4-V", "CT4-V Blackwing", "CT5", "CT5 Luxury", "CT5-V", "CT5-V Blackwing",
    "XT4", "XT4 Luxury", "XT4 Sport", "XT5", "XT5 Luxury", "XT6", "XT6 Luxury", "Lyriq", "Celestiq",
    "CT6", "ATS", "CTS", "CTS-V", "SRX", "STS", "DTS", "Optiq", "Vistiq"
  ],
  "BMW": [
    "118i", "120i", "125i", "M135i", "M140i",
    "220i", "228i", "228i Gran Coupe", "230i", "235i", "M235i", "M235i Gran Coupe", "M240i", "M2", "M2 Competition", "M2 CS",
    "318i", "320i", "320d", "325i", "328i", "330i", "330e", "335i", "340i", "M340i", "M3", "M3 Competition", "M3 CS", "M3 GTS",
    "420i", "428i", "430i", "435i", "440i", "M440i", "M4", "M4 Competition", "M4 CSL", "M4 GTS",
    "520i", "525i", "528i", "530i", "530e", "535i", "540i", "545i", "550i", "550e", "M550i", "M5", "M5 Competition", "M5 CS",
    "630i", "640i", "645i", "650i", "M6", "M6 Gran Coupe",
    "730i", "735i", "740i", "740e", "745e", "745i", "750i", "760i", "M760i",
    "840i", "M850i", "850i", "M8", "M8 Competition", "M8 Gran Coupe",
    "X1", "X1 sDrive", "X1 M35i", "X2", "X2 M35i", "X3", "X3 M", "X3 M40i", "X3 M50", "X3 M Competition", "X4", "X4 M", "X4 M40i",
    "X5", "X5 M", "X5 M50i", "X5 M60i", "X5 M Competition", "X5 45e", "X5 50e", "X5 4.8i",
    "X6", "X6 M", "X6 M50i", "X6 M60i", "X7", "X7 M60i", "XM", "XM Label",
    "Z4", "Z4 M40i", "Z3", "Z3 M", "Z8",
    "i3", "i4", "i4 eDrive40", "i4 M50", "i5", "i5 M60", "i7", "i7 M70", "iX", "iX M60", "iX1", "iX3",
    "Alpina B3", "Alpina B4", "Alpina B5", "Alpina B7", "Alpina XB7",
    "E30", "E36", "E39", "E46", "E60", "E90", "E92", "F30", "F80", "G20", "G80"
  ],
  "Mercedes": [
    "A 180", "A 200", "A 250", "A 35 AMG", "A 45 AMG", "A 45 S AMG",
    "B 200", "B 250",
    "C 180", "C 200", "C 230", "C 250", "C 280", "C 300", "C 350", "C 43 AMG", "C 55 AMG", "C 63 AMG", "C 63 S AMG",
    "E 200", "E 250", "E 280", "E 300", "E 350", "E 400", "E 450", "E 500", "E 53 AMG", "E 55 AMG", "E 63 AMG", "E 63 S AMG",
    "S 320", "S 350", "S 350d", "S 400", "S 450", "S 500", "S 55 AMG", "S 550", "S 580", "S 600", "S 63 AMG", "S 65 AMG", "S 680 Maybach",
    "CLA 180", "CLA 200", "CLA 250", "CLA 35 AMG", "CLA 45 AMG",
    "CLK 200", "CLK 320", "CLK 350", "CLK 500", "CLK 55 AMG", "CLK 63 AMG",
    "CLS 350", "CLS 450", "CLS 500", "CLS 53 AMG", "CLS 55 AMG", "CLS 63 AMG",
    "SL 350", "SL 400", "SL 500", "SL 55 AMG", "SL 63 AMG", "SL 65 AMG", "SLK 200", "SLK 350", "SLC 300",
    "GLA 200", "GLA 250", "GLA 35 AMG", "GLA 45 AMG",
    "GLB 200", "GLB 250", "GLB 35 AMG",
    "GLC 200", "GLC 250", "GLC 300", "GLC 43 AMG", "GLC 63 AMG", "GLC 63 S AMG",
    "GLE 350", "GLE 400", "GLE 450", "GLE 53 AMG", "GLE 63 AMG", "GLE 63 S AMG",
    "GLS 400", "GLS 450", "GLS 500", "GLS 580", "GLS 63 AMG", "GLS 600 Maybach",
    "GL 450", "GL 500", "GL 550", "GL 63 AMG", "ML 250", "ML 350", "ML 500", "ML 63 AMG",
    "G 500", "G 550", "G 63 AMG", "G 63 AMG 4x4²", "G 65 AMG", "G 350d", "G Wagon",
    "AMG GT 43", "AMG GT 53", "AMG GT 63", "AMG GT R", "AMG GT R Pro", "AMG GT Black Series", "AMG GT C", "AMG GT S",
    "AMG ONE", "SLS AMG",
    "CLE 200", "CLE 300", "CLE 450", "CLE 53 AMG",
    "R 350", "R 500", "R 63 AMG",
    "EQA", "EQB", "EQC", "EQE", "EQE SUV", "EQS", "EQS SUV", "EQV",
    "V 250", "V 300", "Vito", "Sprinter", "W124", "W126", "W140", "W202", "W203", "W204", "W205", "W211", "W212", "W213", "W221", "W222", "W223"
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
    "911 Carrera", "911 Carrera S", "911 Carrera T", "911 Carrera 4", "911 Carrera 4S", "911 Carrera GTS",
    "911 Targa", "911 Targa 4S", "911 Turbo", "911 Turbo S",
    "911 GT3", "911 GT3 RS", "911 GT3 Touring", "911 GT2 RS", "911 Dakar", "911 Sport Classic", "911 R",
    "911 (964)", "911 (993)", "911 (996)", "911 (997)", "911 (991)", "911 (992)",
    "718 Boxster", "718 Boxster S", "718 Boxster GTS", "718 Spyder", "718 Spyder RS",
    "718 Cayman", "718 Cayman S", "718 Cayman GTS", "718 Cayman GT4", "718 Cayman GT4 RS",
    "Boxster", "Boxster S", "Cayman", "Cayman S", "Cayman R",
    "Cayenne", "Cayenne S", "Cayenne GTS", "Cayenne Turbo", "Cayenne Turbo GT", "Cayenne E-Hybrid", "Cayenne Coupe",
    "Macan", "Macan S", "Macan GTS", "Macan Turbo", "Macan EV",
    "Panamera", "Panamera 4S", "Panamera GTS", "Panamera Turbo", "Panamera Turbo S", "Panamera 4 E-Hybrid",
    "Taycan", "Taycan 4S", "Taycan GTS", "Taycan Turbo", "Taycan Turbo S", "Taycan Cross Turismo",
    "Carrera GT", "918 Spyder", "959"
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
    "Range Rover Vogue", "Range Rover Vogue SE", "Range Rover HSE", "Range Rover Supercharged",
    "Range Rover Sport", "Range Rover Sport SV", "Range Rover Sport Autobiography", "Range Rover Sport HSE",
    "Range Rover Sport Supercharged", "Range Rover Sport SVR",
    "Range Rover Velar", "Range Rover Velar R-Dynamic", "Range Rover Velar SVAutobiography",
    "Range Rover Evoque", "Range Rover Evoque R-Dynamic",
    "Discovery", "Discovery Metropolitan", "Discovery HSE", "Discovery SE",
    "Discovery Sport", "Discovery Sport R-Dynamic",
    "Defender 90", "Defender 110", "Defender 130", "Defender V8", "Defender X", "Defender XS",
    "Freelander", "Freelander 2", "Discovery 3", "Discovery 4",
    "Range Rover Classic", "Range Rover P38", "Range Rover L322"
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
    "F8 Tributo", "F8 Spider", "812 Superfast", "812 GTS", "812 Competizione", "812 Competizione A",
    "Roma", "Roma Spider", "Portofino", "Portofino M",
    "SF90 Stradale", "SF90 Spider", "SF90 XX", "296 GTB", "296 GTS",
    "Purosangue", "Daytona SP3", "LaFerrari", "LaFerrari Aperta",
    "458 Italia", "458 Spider", "458 Speciale", "458 Speciale A",
    "F430", "F430 Spider", "F430 Scuderia",
    "599 GTB Fiorano", "599 GTO", "California", "California T",
    "FF", "GTC4Lusso", "GTC4Lusso T",
    "F12 Berlinetta", "F12tdf", "Enzo", "F50", "F40", "Testarossa", "360 Modena", "360 Spider",
    "550 Maranello", "575M Maranello"
  ],
  "Lamborghini": [
    "Huracan", "Huracan LP 610-4", "Huracan LP 580-2", "Huracan EVO", "Huracan EVO Spyder", "Huracan EVO RWD",
    "Huracan STO", "Huracan Tecnica", "Huracan Sterrato", "Huracan Performante", "Huracan Performante Spyder",
    "Aventador", "Aventador LP 700-4", "Aventador S", "Aventador SV", "Aventador SVJ", "Aventador SVJ Roadster",
    "Aventador Ultimae", "Aventador Ultimae Roadster",
    "Urus", "Urus S", "Urus Performante", "Urus SE",
    "Revuelto", "Countach LPI 800-4", "Sian", "Sian Roadster",
    "Gallardo", "Gallardo LP 560-4", "Gallardo LP 570-4", "Gallardo Spyder", "Gallardo Superleggera",
    "Murcielago", "Murcielago LP 640", "Murcielago LP 670-4 SV", "Diablo", "Diablo SV", "Diablo GT"
  ],
  "Maserati": [
    "Ghibli", "Ghibli Modena", "Ghibli Trofeo", "Ghibli S", "Ghibli SQ4",
    "Quattroporte", "Quattroporte Modena", "Quattroporte Trofeo", "Quattroporte S", "Quattroporte GTS",
    "Levante", "Levante Modena", "Levante Trofeo", "Levante S", "Levante GTS",
    "GranTurismo", "GranTurismo Folgore", "GranTurismo S", "GranTurismo MC", "GranTurismo Sport",
    "GranCabrio", "GranCabrio Sport", "GranCabrio MC",
    "MC20", "MC20 Cielo", "MC12",
    "Grecale", "Grecale Modena", "Grecale Trofeo", "Grecale Folgore"
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
  "CAN-AM": [
    "Maverick X3", "Maverick X3 Max", "Maverick X3 Turbo", "Maverick X3 X RS", "Maverick X3 X DS",
    "Maverick Trail", "Maverick Sport", "Maverick R",
    "Commander", "Commander XT", "Commander Max",
    "Defender", "Defender XT", "Defender Max", "Defender Pro",
    "Outlander", "Outlander XT", "Outlander Max", "Outlander DPS",
    "Renegade", "Renegade X MR", "Renegade XXC",
    "Spyder F3", "Spyder RT", "Ryker"
  ],
  "Polaris": [
    "RZR XP 1000", "RZR XP Turbo", "RZR Pro XP", "RZR Pro R", "RZR Turbo R", "RZR 200",
    "Ranger XP 1000", "Ranger Crew XP 1000", "Ranger SP 570", "Ranger 1000",
    "General XP 1000", "General 4 1000",
    "Sportsman 570", "Sportsman 850", "Sportsman XP 1000",
    "Scrambler XP 1000", "Outlaw 110",
    "Slingshot", "Slingshot R", "Slingshot SL"
  ],
  "Motorcycles": [
    "Harley-Davidson Sportster", "Harley-Davidson Softail", "Harley-Davidson Touring", "Harley-Davidson Street Glide",
    "Harley-Davidson Road King", "Harley-Davidson Fat Boy", "Harley-Davidson Iron 883", "Harley-Davidson Road Glide",
    "Harley-Davidson Pan America", "Harley-Davidson LiveWire",
    "Ducati Panigale V4", "Ducati Panigale V2", "Ducati Monster", "Ducati Multistrada", "Ducati Scrambler",
    "Ducati Diavel", "Ducati Streetfighter V4", "Ducati Hypermotard", "Ducati DesertX",
    "BMW R 1250 GS", "BMW S 1000 RR", "BMW R nineT", "BMW F 900 R", "BMW K 1600",
    "Kawasaki Ninja ZX-10R", "Kawasaki Ninja ZX-6R", "Kawasaki Ninja 400", "Kawasaki Z900", "Kawasaki Z650",
    "Kawasaki Versys 1000", "Kawasaki Vulcan", "Kawasaki KLR 650",
    "Honda CBR 1000RR", "Honda CBR 600RR", "Honda Africa Twin", "Honda Gold Wing", "Honda CB650R", "Honda Rebel 500",
    "Yamaha YZF-R1", "Yamaha YZF-R6", "Yamaha MT-09", "Yamaha MT-07", "Yamaha Tenere 700", "Yamaha XMAX",
    "Suzuki GSX-R1000", "Suzuki GSX-R750", "Suzuki V-Strom 1050", "Suzuki Hayabusa", "Suzuki Katana",
    "KTM 1290 Super Duke", "KTM 890 Duke", "KTM 390 Duke", "KTM 1290 Super Adventure",
    "Triumph Speed Triple", "Triumph Street Triple", "Triumph Tiger", "Triumph Bonneville",
    "Indian Scout", "Indian Chief", "Indian Challenger", "Indian FTR",
    "Aprilia RSV4", "Aprilia Tuono", "MV Agusta F3", "MV Agusta Brutale"
  ],
  "Tesla": [
    "Model 3", "Model 3 Long Range", "Model 3 Performance",
    "Model Y", "Model Y Long Range", "Model Y Performance",
    "Model S", "Model S Long Range", "Model S Plaid",
    "Model X", "Model X Long Range", "Model X Plaid",
    "Cybertruck", "Cybertruck AWD", "Cybertruck Cyberbeast",
    "Roadster"
  ],
  "Volvo": [
    "S60", "S60 T5", "S60 T6", "S60 T8", "S60 Polestar",
    "S90", "S90 T5", "S90 T6", "S90 T8",
    "V60", "V60 Cross Country", "V60 T5", "V60 T8",
    "V90", "V90 Cross Country",
    "XC40", "XC40 T4", "XC40 T5", "XC40 Recharge",
    "XC60", "XC60 T5", "XC60 T6", "XC60 T8", "XC60 Polestar",
    "XC90", "XC90 T5", "XC90 T6", "XC90 T8", "XC90 Recharge",
    "EX30", "EX40", "EC40", "EX90",
    "C30", "C70", "V40", "V40 Cross Country", "S40", "240", "740", "850"
  ],
  "Lincoln": [
    "Navigator", "Navigator L", "Navigator Reserve", "Navigator Black Label",
    "Aviator", "Aviator Reserve", "Aviator Grand Touring", "Aviator Black Label",
    "Corsair", "Corsair Reserve", "Corsair Grand Touring",
    "Nautilus", "Nautilus Reserve", "Nautilus Black Label",
    "Continental", "Continental Reserve", "Continental Black Label",
    "MKZ", "MKZ Hybrid", "MKC", "MKX", "MKT", "Town Car"
  ],
  "Peugeot": [
    "208", "e-208", "2008", "e-2008",
    "308", "308 GT", "308 SW",
    "3008", "3008 GT", "e-3008",
    "408", "508", "508 GT", "508 SW",
    "5008", "e-5008",
    "Partner", "Rifter", "Traveller", "Expert",
    "RCZ",
    "206", "206 CC", "207", "207 CC", "301",
    "306", "307", "307 CC", "406", "407", "607"
  ],
  "Renault": [
    "Clio", "Clio RS",
    "Megane", "Megane RS", "Megane E-Tech",
    "Scenic", "Scenic E-Tech",
    "Captur", "Captur E-Tech",
    "Arkana", "Austral", "Koleos",
    "Espace", "Talisman",
    "Zoe", "Kangoo", "Trafic", "Master",
    "Duster", "Symbol", "Fluence", "Safrane", "Laguna",
    "5 E-Tech", "Twingo"
  ],
  "Acura": [
    "ILX", "TLX", "TLX Type S", "RLX",
    "Integra", "Integra Type S",
    "MDX", "MDX Type S", "MDX A-Spec",
    "RDX", "RDX A-Spec",
    "ZDX", "ZDX Type S",
    "NSX", "NSX Type S",
    "TSX", "RSX", "Legend", "RL", "TL"
  ],
  "Mini": [
    "Cooper", "Cooper S", "Cooper SE", "Cooper JCW",
    "Countryman", "Countryman S", "Countryman SE", "Countryman JCW",
    "Clubman", "Clubman S", "Clubman JCW",
    "Convertible", "Convertible S", "Convertible JCW",
    "Paceman", "Coupe", "Roadster"
  ],
  "Suzuki": [
    "Swift", "Swift Sport",
    "Baleno", "Ciaz", "Dzire",
    "Vitara", "Grand Vitara", "S-Cross",
    "Jimny", "Jimny 5-Door",
    "Ertiga", "XL7",
    "Ignis", "Alto", "Celerio", "Carry", "Every",
    "SX4", "Kizashi", "Liana"
  ],
  "Fiat": [
    "500", "500e", "500X", "500L", "500C",
    "Tipo", "Tipo Cross", "Panda", "Panda Cross",
    "Punto", "Punto Evo", "Linea",
    "Doblo", "Ducato", "Fiorino",
    "Abarth 500", "Abarth 595", "Abarth 695",
    "124 Spider", "Bravo", "Stilo", "Multipla"
  ],
  "Citroen": [
    "C3", "C3 Aircross",
    "C4", "C4 X", "C4 Cactus",
    "C5 Aircross", "C5 X",
    "Berlingo", "SpaceTourer", "Jumpy", "Jumper",
    "DS3", "DS4", "DS5", "DS7",
    "C1", "C2", "C-Elysee", "Xsara"
  ],
  "Jetour": [
    "T2", "T2 Pro",
    "Dashing", "Dashing Pro",
    "X70", "X70 Plus", "X70S",
    "X90", "X90 Plus",
    "T1"
  ],
};

// Listing status for moderation
export const LISTING_STATUS = ["pending", "approved", "rejected", "sold"] as const;
export type ListingStatus = typeof LISTING_STATUS[number];

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: integer("price"), // in AED whole numbers - optional
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
  rejectedAt: timestamp("rejected_at"), // Timestamp when rejected (for 7-day cleanup)
  expiresAt: timestamp("expires_at"), // Set to 1 month after approval
  expirationNotified: boolean("expiration_notified").default(false), // Track if expiry notification sent
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
  userId: varchar("user_id").notNull().references(() => users.id),
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

// Device tokens for push notifications (FCM)
export const deviceTokens = pgTable("device_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  fcmToken: text("fcm_token").notNull(),
  deviceOs: varchar("device_os", { length: 20 }), // "ios" or "android"
  deviceName: text("device_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertDeviceTokenSchema = createInsertSchema(deviceTokens).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true, // Set from auth
});

export type DeviceToken = typeof deviceTokens.$inferSelect;
export type InsertDeviceToken = z.infer<typeof insertDeviceTokenSchema>;

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
