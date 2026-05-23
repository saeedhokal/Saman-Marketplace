export type SeoLang = "en" | "ar";

export interface SeoFaq {
  q: string;
  a: string;
}

export interface SeoSection {
  heading: string;
  body: string;
}

export interface SeoPage {
  slug: string;
  lang: SeoLang;
  path: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  keywords: string[];
  sections: SeoSection[];
  faqs: SeoFaq[];
  primaryCta: { text: string; href: string };
  secondaryCta: { text: string; href: string };
  related: { text: string; href: string }[];
  altLangPath: string;
}

const SITE = "https://thesamanapp.com";

const EN_RELATED = [
  { text: "Spare parts in Dubai", href: "/spare-parts-dubai" },
  { text: "Used car parts in UAE", href: "/used-car-parts-uae" },
  { text: "Car parts in Dubai", href: "/car-parts-dubai" },
  { text: "Sell car parts in UAE", href: "/sell-car-parts-uae" },
  { text: "Used cars in UAE", href: "/used-cars-uae" },
  { text: "Sell your car in Dubai", href: "/sell-car-dubai" },
];

const AR_RELATED = [
  { text: "قطع غيار في دبي", href: "/ar/spare-parts-dubai" },
  { text: "قطع غيار مستعملة في الإمارات", href: "/ar/used-car-parts-uae" },
  { text: "قطع غيار السيارات دبي", href: "/ar/car-parts-dubai" },
  { text: "بيع قطع غيار في الإمارات", href: "/ar/sell-car-parts-uae" },
  { text: "سيارات مستعملة في الإمارات", href: "/ar/used-cars-uae" },
  { text: "بيع سيارتك في دبي", href: "/ar/sell-car-dubai" },
];

function en(
  slug: string,
  page: Omit<SeoPage, "slug" | "lang" | "path" | "altLangPath" | "related"> & {
    related?: { text: string; href: string }[];
    altLangPath?: string;
  }
): SeoPage {
  const { related, altLangPath, ...rest } = page;
  return {
    slug,
    lang: "en",
    path: `/${slug}`,
    altLangPath: altLangPath ?? `/ar/${slug}`,
    related: related ?? EN_RELATED.filter((r) => r.href !== `/${slug}`),
    ...rest,
  };
}

function ar(slug: string, page: Omit<SeoPage, "slug" | "lang" | "path" | "altLangPath" | "related">): SeoPage {
  return {
    slug,
    lang: "ar",
    path: `/ar/${slug}`,
    altLangPath: `/${slug}`,
    related: AR_RELATED.filter((r) => r.href !== `/ar/${slug}`),
    ...page,
  };
}

export const SEO_PAGES: SeoPage[] = [
  en("spare-parts-dubai", {
    title: "Spare Parts in Dubai | Buy & Sell Used Car Parts on Saman Marketplace",
    metaDescription:
      "Looking for spare parts in Dubai? Saman Marketplace is the UAE app to buy and sell used car parts, engines, wheels, tyres and accessories. Free to post, direct buyer & seller chat, no middlemen.",
    h1: "Spare Parts in Dubai — Buy & Sell on Saman Marketplace",
    intro:
      "Saman Marketplace is the easiest way to find spare parts in Dubai. Browse thousands of car parts listed by real sellers across the UAE — engines, gearboxes, body panels, lights, rims, tyres, electronics and accessories — and message the seller directly. No commissions, no middlemen, no spam.",
    keywords: [
      "spare parts in Dubai",
      "car spare parts Dubai",
      "used car parts Dubai",
      "auto parts Dubai",
      "Saman Marketplace",
    ],
    sections: [
      {
        heading: "Why use Saman for spare parts in Dubai",
        body: "Dubai has one of the largest used car parts markets in the region, but most of it lives across scattered WhatsApp groups, dealers in Al Aweer, and online classifieds full of duplicates. Saman Marketplace brings every listing into one clean app — searchable, filterable and free. You see the part, the price in AED, the location, and you contact the seller directly.",
      },
      {
        heading: "What you can find",
        body: "Engines, gearboxes and transmissions, body parts and panels, headlights and tail lights, wheels and rims, tyres, batteries, ECU and electronics, interior trim, performance and tuning parts, OEM and aftermarket parts for Toyota, Nissan, Lexus, Mercedes, BMW, Audi, Land Rover, Porsche, Honda, Hyundai, Kia, Ford, Chevrolet, Mitsubishi, Infiniti, GMC and more.",
      },
      {
        heading: "Free to post, easy to find",
        body: "Sellers post for free. Buyers search by category, brand, model or keyword. Every listing has photos, price in AED, and a Dubai or UAE location. If you're a dealer in Al Aweer, Ras Al Khor or anywhere else in the Emirates, Saman gives your inventory a clean storefront and direct WhatsApp/call leads.",
      },
    ],
    faqs: [
      {
        q: "Where can I buy spare parts in Dubai online?",
        a: "You can buy spare parts in Dubai on Saman Marketplace. Browse listings by category and brand, then contact the seller directly through the app.",
      },
      {
        q: "Can I sell used car parts in Dubai for free?",
        a: "Yes. Saman Marketplace lets you post used car parts for free during the current launch period. You keep 100% of the sale — there are no commissions.",
      },
      {
        q: "Does Saman cover spare parts outside Dubai?",
        a: "Yes. Saman is a UAE-wide marketplace — listings are available from Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Umm Al Quwain and Fujairah.",
      },
      {
        q: "Are the parts on Saman new or used?",
        a: "Both. Each listing clearly shows whether the part is new, used or refurbished, with photos and a price in AED.",
      },
    ],
    primaryCta: { text: "Post a Part for Free", href: "/sell" },
    secondaryCta: { text: "Browse Spare Parts", href: "/categories?main=Spare%20Parts" },
  }),

  en("used-car-parts-uae", {
    title: "Used Car Parts in UAE | Saman Marketplace",
    metaDescription:
      "Find used car parts across the UAE on Saman Marketplace. Engines, body parts, wheels, electronics and more from real sellers in Dubai, Abu Dhabi and Sharjah. Free listings, no middlemen.",
    h1: "Used Car Parts in the UAE",
    intro:
      "Saman Marketplace is the UAE's app for used car parts. Whether you're rebuilding a Patrol in Sharjah, restoring a Land Cruiser in Abu Dhabi, or just need a single headlight in Dubai, Saman makes it easy to find used auto parts at fair prices from sellers across the Emirates.",
    keywords: [
      "used car parts UAE",
      "used auto parts UAE",
      "second hand car parts UAE",
      "Saman Marketplace",
    ],
    sections: [
      {
        heading: "A nationwide UAE marketplace",
        body: "Most spare parts in the UAE move through small dealers and scrap yards in Al Aweer, Sharjah industrial zones and around Mussafah. Saman pulls those listings online so you can search the whole country from your phone — no driving from yard to yard, no haggling with five different middlemen.",
      },
      {
        heading: "Verified categories",
        body: "Used engines, used gearboxes, body parts and panels, used wheels and rims, used tyres, used ECUs and modules, used interior parts, used suspension and brakes, and used lights — all clearly tagged with condition (used, refurbished, new) and a price in AED.",
      },
      {
        heading: "Direct contact with the seller",
        body: "Every listing on Saman has the seller's contact details. Message, call or WhatsApp the seller directly. There's no commission, no order-blocking, and no fake middlemen between you and the part.",
      },
    ],
    faqs: [
      {
        q: "Where can I find used car parts in the UAE?",
        a: "Saman Marketplace is one of the easiest ways to find used car parts across the UAE. It lists parts from Dubai, Abu Dhabi, Sharjah, Ajman and other emirates in one app.",
      },
      {
        q: "Are used parts on Saman cheaper than new?",
        a: "Used parts are generally much cheaper than brand-new OEM parts. Each Saman listing shows the exact price in AED so you can compare easily.",
      },
      {
        q: "Can I return a used part bought on Saman?",
        a: "Saman is a peer-to-peer marketplace. Return and warranty terms are agreed directly between buyer and seller — always confirm before paying.",
      },
    ],
    primaryCta: { text: "Browse Used Parts", href: "/categories?main=Spare%20Parts" },
    secondaryCta: { text: "Post a Part for Free", href: "/sell" },
  }),

  en("car-parts-dubai", {
    title: "Car Parts in Dubai | OEM & Aftermarket on Saman Marketplace",
    metaDescription:
      "Buy and sell car parts in Dubai on Saman Marketplace. OEM and aftermarket parts for every major brand — engines, body, wheels, electronics. Free listings, direct seller contact.",
    h1: "Car Parts in Dubai",
    intro:
      "Saman Marketplace is the simplest place to buy and sell car parts in Dubai. From OEM Toyota parts to aftermarket BMW upgrades, the app brings every category into one searchable feed with real photos, AED prices and direct seller contact.",
    keywords: [
      "car parts Dubai",
      "auto parts Dubai",
      "OEM car parts Dubai",
      "aftermarket car parts Dubai",
    ],
    sections: [
      {
        heading: "OEM and aftermarket",
        body: "Whether you want a genuine OEM part for a recent model or a performance aftermarket upgrade, Saman lists both. Filter by brand (Toyota, Nissan, Lexus, Mercedes, BMW, Audi, Porsche, Honda, Hyundai and more) and find the part you need from sellers across Dubai.",
      },
      {
        heading: "Built for the Dubai market",
        body: "Saman is UAE-first — every price is in AED, every location is a real emirate, and the app supports English and Arabic. Listings are reviewed before they go live to keep the marketplace clean and free of spam.",
      },
      {
        heading: "Why list on Saman",
        body: "Dealers and individual sellers in Dubai use Saman to reach buyers across the UAE without paying commissions. Posting a listing is free, and you keep 100% of the sale.",
      },
    ],
    faqs: [
      {
        q: "Can I find OEM car parts in Dubai on Saman?",
        a: "Yes. Many sellers on Saman list OEM (original) car parts. Each listing shows the brand, condition and price in AED.",
      },
      {
        q: "Do I need to register to browse car parts in Dubai?",
        a: "No, browsing is free and open. You only need an account if you want to post a listing or contact a seller.",
      },
    ],
    primaryCta: { text: "Browse Car Parts", href: "/categories?main=Spare%20Parts" },
    secondaryCta: { text: "Post a Part for Free", href: "/sell" },
  }),

  en("sell-car-parts-uae", {
    title: "Sell Car Parts Online in UAE | List for Free on Saman Marketplace",
    metaDescription:
      "Sell car parts online in the UAE for free on Saman Marketplace. Reach buyers across Dubai, Abu Dhabi and Sharjah. No commissions, no middlemen — direct contact with the buyer.",
    h1: "Sell Car Parts Online in the UAE",
    intro:
      "Saman Marketplace gives every UAE seller — from dealers in Al Aweer to weekend mechanics in Sharjah — a free platform to sell car parts online. List in minutes, get found by buyers across the Emirates, and keep 100% of every sale.",
    keywords: [
      "sell car parts UAE",
      "sell auto parts UAE",
      "sell spare parts Dubai",
      "list car parts UAE",
    ],
    sections: [
      {
        heading: "Free, fast, fair",
        body: "Posting on Saman is free during the launch period. There's no commission on sales, no charge per listing, and no monthly fee. Take a few photos, set a price in AED, choose a category, and your part is live.",
      },
      {
        heading: "Reach buyers across the UAE",
        body: "Saman buyers come from Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Umm Al Quwain and Fujairah. Your listing is visible to all of them — not just one local WhatsApp group.",
      },
      {
        heading: "Direct contact, no middlemen",
        body: "Buyers contact you directly through the app, via WhatsApp or by phone. No order routing, no fake leads. You agree the deal, the price and the delivery yourself.",
      },
    ],
    faqs: [
      {
        q: "Is it really free to sell car parts on Saman?",
        a: "Yes — posting is free and there are no commissions on sales during the launch period.",
      },
      {
        q: "How long does it take for a listing to go live?",
        a: "Listings are reviewed by Saman and typically go live within a few hours to keep the marketplace clean and free of spam.",
      },
      {
        q: "Do I need a trade licence to sell parts on Saman?",
        a: "Individual sellers and licensed dealers can both list on Saman. Sellers must follow UAE laws for any business activity they carry out.",
      },
    ],
    primaryCta: { text: "Post a Part for Free", href: "/sell" },
    secondaryCta: { text: "See Top Categories", href: "/categories" },
  }),

  en("used-cars-uae", {
    title: "Used Cars in UAE | Buy & Sell Used Vehicles on Saman Marketplace",
    metaDescription:
      "Used cars in UAE — buy and sell used vehicles on Saman Marketplace. Real listings from Dubai, Abu Dhabi and Sharjah. Free to post, direct contact, no middlemen.",
    h1: "Used Cars in the UAE",
    intro:
      "Saman Marketplace is the simplest way to buy and sell used cars in the UAE. Browse real, recent listings from owners and dealers across Dubai, Abu Dhabi and Sharjah, see prices in AED, and contact the seller directly.",
    keywords: [
      "used cars UAE",
      "used cars Dubai",
      "second hand cars UAE",
      "used vehicles UAE",
    ],
    sections: [
      {
        heading: "Real listings from real sellers",
        body: "Saman shows you used cars across the UAE with proper photos, mileage, year, price in AED and a real city location. No bait listings, no fake prices.",
      },
      {
        heading: "Every major brand",
        body: "Toyota, Nissan, Lexus, Mercedes-Benz, BMW, Audi, Land Rover, Range Rover, Porsche, Honda, Hyundai, Kia, Ford, Chevrolet, Mitsubishi, Infiniti, GMC, Dodge and more — all listed by individuals and dealers across the Emirates.",
      },
      {
        heading: "GCC and non-GCC specs",
        body: "Every listing clearly tags GCC or non-GCC spec, so you know what you're buying before you message the seller. The marketplace also tracks service history info where available.",
      },
    ],
    faqs: [
      {
        q: "Where can I buy used cars in the UAE?",
        a: "Saman Marketplace lists used cars from owners and dealers across the UAE — Dubai, Abu Dhabi, Sharjah and other emirates.",
      },
      {
        q: "Are prices on Saman in AED?",
        a: "Yes, every used car price on Saman is shown in AED (United Arab Emirates Dirham).",
      },
      {
        q: "Can I see whether a car is GCC spec?",
        a: "Yes — sellers tag every listing as GCC or non-GCC so you can filter before contacting them.",
      },
    ],
    primaryCta: { text: "Browse Used Cars", href: "/categories?main=Cars" },
    secondaryCta: { text: "Sell Your Car", href: "/sell" },
  }),

  en("sell-car-dubai", {
    title: "Sell Your Car in Dubai | Free Listings on Saman Marketplace",
    metaDescription:
      "Sell your car in Dubai for free on Saman Marketplace. Reach UAE buyers in minutes — direct contact, no middlemen, no commissions. AED prices, GCC/non-GCC tagging.",
    h1: "Sell Your Car in Dubai — Free on Saman Marketplace",
    intro:
      "Listing a car in Dubai shouldn't cost you a commission. Saman Marketplace lets you sell your car in Dubai for free, with photos, price in AED, spec, mileage and location — and buyers contact you directly.",
    keywords: [
      "sell my car Dubai",
      "sell car Dubai",
      "sell car UAE",
      "list car Dubai",
    ],
    sections: [
      {
        heading: "Why sell on Saman",
        body: "No commission. No charge to list. No middleman between you and the buyer. You set the price, you accept the offer, and you complete the deal directly with the buyer.",
      },
      {
        heading: "How it works",
        body: "Create an account, tap +, upload photos, fill in make, model, year, mileage, GCC spec, and a description. Set your price in AED. Your listing goes live after a quick review and is visible across the UAE.",
      },
      {
        heading: "Reach the whole UAE",
        body: "Your Dubai listing is visible to buyers in Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Umm Al Quwain and Fujairah — not just one city or one Facebook group.",
      },
    ],
    faqs: [
      {
        q: "Is it free to sell a car in Dubai on Saman?",
        a: "Yes — posting a car for sale on Saman is free during the launch period and there are no commissions on the sale.",
      },
      {
        q: "How fast will my car listing go live?",
        a: "Listings are reviewed by Saman and typically go live within a few hours.",
      },
      {
        q: "Can I edit or renew my car listing later?",
        a: "Yes. You can edit, pause, renew or delete your listing from the My Listings page in the app.",
      },
    ],
    primaryCta: { text: "List Your Car for Free", href: "/sell" },
    secondaryCta: { text: "Browse Cars", href: "/categories?main=Cars" },
  }),

  // ===== Arabic =====
  ar("spare-parts-dubai", {
    title: "قطع غيار سيارات في دبي | بيع وشراء قطع الغيار على سوق سامان",
    metaDescription:
      "ابحث عن قطع غيار السيارات في دبي على سوق سامان — تطبيق الإمارات لبيع وشراء قطع غيار السيارات الجديدة والمستعملة. مجاني للنشر، تواصل مباشر مع البائع، بدون عمولات.",
    h1: "قطع غيار السيارات في دبي — على سوق سامان",
    intro:
      "سوق سامان هو أسهل طريقة للعثور على قطع غيار السيارات في دبي. تصفّح آلاف الإعلانات من بائعين حقيقيين في الإمارات — محركات، صناديق تروس، هياكل، إضاءة، جنوط، إطارات، إلكترونيات وإكسسوارات — وتواصل مع البائع مباشرة. بدون عمولات وبدون وسطاء.",
    keywords: [
      "قطع غيار دبي",
      "قطع غيار السيارات دبي",
      "قطع غيار مستعملة دبي",
      "سوق سامان",
    ],
    sections: [
      {
        heading: "لماذا سامان لقطع الغيار في دبي",
        body: "سوق قطع الغيار في دبي ضخم لكنه موزع بين مجموعات واتساب ومحلات في العوير والعديد من الإعلانات المكررة. سامان يجمع كل الإعلانات في تطبيق واحد منظم وقابل للبحث، مع صورة وسعر بالدرهم وموقع البائع.",
      },
      {
        heading: "ما يمكنك إيجاده",
        body: "محركات، صناديق تروس، هياكل وأبواب، مصابيح أمامية وخلفية، جنوط، إطارات، بطاريات، أجهزة ECU وإلكترونيات، تشطيبات داخلية، قطع تعديل وأداء، قطع OEM وبدائل لسيارات تويوتا، نيسان، لكزس، مرسيدس، BMW، أودي، لاند روفر، بورش، هوندا، هيونداي، كيا، فورد، شيفروليه وغيرها.",
      },
      {
        heading: "مجاني للنشر، سهل للبحث",
        body: "البائعون ينشرون مجاناً. المشترون يبحثون حسب الفئة، الماركة، الموديل أو الكلمة المفتاحية. كل إعلان يحتوي على صور، سعر بالدرهم، وموقع في دبي أو الإمارات.",
      },
    ],
    faqs: [
      {
        q: "أين يمكنني شراء قطع غيار سيارات في دبي عبر الإنترنت؟",
        a: "يمكنك شراء قطع الغيار في دبي عبر سوق سامان. تصفّح الإعلانات حسب الفئة والماركة وتواصل مع البائع مباشرة.",
      },
      {
        q: "هل يمكنني بيع قطع غيار مستعملة في دبي مجاناً؟",
        a: "نعم. سوق سامان يتيح نشر إعلانات قطع الغيار مجاناً خلال فترة الإطلاق. تحتفظ بـ 100% من قيمة البيع بدون عمولات.",
      },
      {
        q: "هل يغطي سامان قطع الغيار خارج دبي؟",
        a: "نعم. سامان سوق على مستوى الإمارات — تجد إعلانات من دبي وأبوظبي والشارقة وعجمان ورأس الخيمة وأم القيوين والفجيرة.",
      },
    ],
    primaryCta: { text: "أضف قطعة مجاناً", href: "/sell" },
    secondaryCta: { text: "تصفّح قطع الغيار", href: "/categories?main=Spare%20Parts" },
  }),

  ar("used-car-parts-uae", {
    title: "قطع غيار مستعملة في الإمارات | سوق سامان",
    metaDescription:
      "قطع غيار سيارات مستعملة في الإمارات على سوق سامان — محركات، هياكل، جنوط، إلكترونيات وأكثر من بائعين حقيقيين في دبي وأبوظبي والشارقة. مجاني للنشر، بدون وسطاء.",
    h1: "قطع غيار سيارات مستعملة في الإمارات",
    intro:
      "سوق سامان هو تطبيق الإمارات لقطع غيار السيارات المستعملة. سواء كنت تعيد بناء باترول في الشارقة، أو تجدد لاند كروزر في أبوظبي، أو تحتاج مصباحاً واحداً في دبي — سامان يجعل العثور على القطع المستعملة سهلاً وبأسعار عادلة.",
    keywords: [
      "قطع غيار مستعملة الإمارات",
      "قطع غيار مستعملة دبي",
      "قطع سيارات مستعملة",
      "سوق سامان",
    ],
    sections: [
      {
        heading: "سوق على مستوى الإمارات",
        body: "معظم قطع الغيار في الإمارات تتحرك عبر محلات صغيرة وأسواق متفرقة في العوير والشارقة الصناعية ومصفح. سامان يجمعها في مكان واحد على الإنترنت لتبحث في الدولة كلها من هاتفك.",
      },
      {
        heading: "فئات موثوقة",
        body: "محركات مستعملة، صناديق تروس مستعملة، هياكل وأبواب، جنوط مستعملة، إطارات، ECU وأجهزة تحكم، قطع داخلية، نظام تعليق وفرامل، إضاءة — مع تحديد الحالة (جديد، مستعمل، مجدّد) وسعر بالدرهم.",
      },
      {
        heading: "تواصل مباشر مع البائع",
        body: "كل إعلان على سامان يحتوي على بيانات تواصل البائع. راسله أو اتصل به أو تواصل عبر واتساب مباشرة. لا عمولات ولا وسطاء.",
      },
    ],
    faqs: [
      {
        q: "أين أجد قطع غيار مستعملة في الإمارات؟",
        a: "سوق سامان من أسهل الطرق للعثور على قطع غيار مستعملة في الإمارات. يضم إعلانات من دبي وأبوظبي والشارقة وعجمان والإمارات الأخرى في تطبيق واحد.",
      },
      {
        q: "هل القطع المستعملة على سامان أرخص من الجديدة؟",
        a: "عادة تكون القطع المستعملة أرخص بكثير من القطع الأصلية الجديدة. كل إعلان يعرض السعر بالدرهم لتسهيل المقارنة.",
      },
    ],
    primaryCta: { text: "تصفّح القطع المستعملة", href: "/categories?main=Spare%20Parts" },
    secondaryCta: { text: "أضف قطعة مجاناً", href: "/sell" },
  }),

  ar("car-parts-dubai", {
    title: "قطع غيار السيارات في دبي | OEM وبدائل على سوق سامان",
    metaDescription:
      "بيع وشراء قطع غيار السيارات في دبي على سوق سامان. قطع أصلية OEM وبدائل لجميع الماركات — محركات، هياكل، جنوط، إلكترونيات. مجاني للنشر، تواصل مباشر مع البائع.",
    h1: "قطع غيار السيارات في دبي",
    intro:
      "سوق سامان هو أسهل مكان لشراء وبيع قطع غيار السيارات في دبي. من قطع تويوتا الأصلية إلى ترقيات BMW البديلة — كل الفئات في تطبيق واحد، بصور حقيقية وأسعار بالدرهم وتواصل مباشر مع البائع.",
    keywords: [
      "قطع غيار السيارات دبي",
      "قطع غيار أصلية دبي",
      "قطع غيار بدائل دبي",
    ],
    sections: [
      {
        heading: "أصلية وبديلة",
        body: "سواء أردت قطعة OEM أصلية أو ترقية أداء بديلة، سامان يضم الاثنين. فلتر حسب الماركة (تويوتا، نيسان، لكزس، مرسيدس، BMW، أودي، بورش، هوندا، هيونداي وغيرها).",
      },
      {
        heading: "مصمم لسوق دبي",
        body: "سامان إماراتي بالكامل — كل سعر بالدرهم، كل موقع إمارة حقيقية، والتطبيق يدعم العربية والإنجليزية. الإعلانات تُراجَع قبل نشرها للحفاظ على سوق نظيف.",
      },
    ],
    faqs: [
      {
        q: "هل أجد قطع OEM أصلية في دبي على سامان؟",
        a: "نعم. كثير من البائعين يعرضون قطع OEM أصلية. كل إعلان يوضّح الماركة والحالة والسعر بالدرهم.",
      },
      {
        q: "هل أحتاج تسجيل لتصفّح قطع الغيار في دبي؟",
        a: "لا. التصفّح مجاني ومفتوح. تحتاج حساباً فقط إذا أردت النشر أو التواصل مع بائع.",
      },
    ],
    primaryCta: { text: "تصفّح قطع الغيار", href: "/categories?main=Spare%20Parts" },
    secondaryCta: { text: "أضف قطعة مجاناً", href: "/sell" },
  }),

  ar("sell-car-parts-uae", {
    title: "بيع قطع غيار السيارات في الإمارات | إعلانات مجانية على سوق سامان",
    metaDescription:
      "بيع قطع غيار السيارات في الإمارات مجاناً على سوق سامان. اوصل إلى مشترين في دبي وأبوظبي والشارقة بدون عمولات ولا وسطاء — تواصل مباشر مع المشتري.",
    h1: "بيع قطع غيار السيارات في الإمارات",
    intro:
      "سوق سامان يمنح كل بائع في الإمارات — من تجار العوير إلى الميكانيكي في الشارقة — منصة مجانية لبيع قطع غيار السيارات. أضف إعلانك في دقائق، وكن مرئياً لمشترين في كل الإمارات، واحتفظ بـ 100% من قيمة البيع.",
    keywords: [
      "بيع قطع غيار الإمارات",
      "بيع قطع غيار دبي",
      "نشر قطع غيار",
    ],
    sections: [
      {
        heading: "مجاني، سريع، عادل",
        body: "النشر على سامان مجاني خلال فترة الإطلاق. لا عمولة على البيع، لا رسوم لكل إعلان، ولا اشتراك شهري. التقط صور القطعة، ضع سعراً بالدرهم، اختر الفئة، ثم انشر.",
      },
      {
        heading: "وصول للإمارات كلها",
        body: "مشترو سامان يأتون من دبي وأبوظبي والشارقة وعجمان ورأس الخيمة وأم القيوين والفجيرة. إعلانك مرئي لهم جميعاً وليس لمجموعة واتساب واحدة فقط.",
      },
      {
        heading: "تواصل مباشر",
        body: "المشترون يتواصلون معك مباشرة عبر التطبيق أو واتساب أو الهاتف. لا توجيه طلبات ولا عملاء وهميين. أنت تتفق على السعر والتسليم بنفسك.",
      },
    ],
    faqs: [
      {
        q: "هل بيع قطع الغيار على سامان مجاني فعلاً؟",
        a: "نعم — النشر مجاني ولا توجد عمولات على البيع خلال فترة الإطلاق.",
      },
      {
        q: "كم يستغرق ظهور الإعلان؟",
        a: "تُراجَع الإعلانات من قبل سامان وتظهر عادة خلال ساعات قليلة للحفاظ على سوق نظيف خالٍ من الإعلانات الوهمية.",
      },
    ],
    primaryCta: { text: "أضف قطعة مجاناً", href: "/sell" },
    secondaryCta: { text: "تصفّح الفئات", href: "/categories" },
  }),

  ar("used-cars-uae", {
    title: "سيارات مستعملة في الإمارات | بيع وشراء على سوق سامان",
    metaDescription:
      "سيارات مستعملة في الإمارات — بيع وشراء السيارات المستعملة على سوق سامان. إعلانات حقيقية من دبي وأبوظبي والشارقة. مجاني للنشر، تواصل مباشر، بدون وسطاء.",
    h1: "سيارات مستعملة في الإمارات",
    intro:
      "سوق سامان هو أبسط طريقة لشراء وبيع السيارات المستعملة في الإمارات. تصفّح إعلانات حقيقية حديثة من أصحاب السيارات والوكلاء في دبي وأبوظبي والشارقة، شاهد الأسعار بالدرهم، وتواصل مع البائع مباشرة.",
    keywords: [
      "سيارات مستعملة الإمارات",
      "سيارات مستعملة دبي",
      "سيارات للبيع الإمارات",
    ],
    sections: [
      {
        heading: "إعلانات حقيقية من بائعين حقيقيين",
        body: "سامان يعرض السيارات المستعملة في الإمارات بصور حقيقية، الكيلومترات، السنة، السعر بالدرهم، وموقع المدينة. لا إعلانات وهمية ولا أسعار مزيّفة.",
      },
      {
        heading: "كل الماركات الكبرى",
        body: "تويوتا، نيسان، لكزس، مرسيدس، BMW، أودي، لاند روفر، رينج روفر، بورش، هوندا، هيونداي، كيا، فورد، شيفروليه، ميتسوبيشي، إنفينيتي، GMC، دودج وغيرها.",
      },
      {
        heading: "خليجي وغير خليجي",
        body: "كل إعلان يوضّح إذا كانت السيارة خليجية المواصفات أم لا، حتى تعرف ما تشتري قبل أن تتواصل مع البائع.",
      },
    ],
    faqs: [
      {
        q: "أين أشتري سيارة مستعملة في الإمارات؟",
        a: "سوق سامان يعرض سيارات مستعملة من أصحابها ومن الوكلاء في دبي وأبوظبي والشارقة وباقي الإمارات.",
      },
      {
        q: "هل الأسعار على سامان بالدرهم؟",
        a: "نعم، كل سعر سيارة على سامان يُعرض بالدرهم الإماراتي.",
      },
    ],
    primaryCta: { text: "تصفّح السيارات", href: "/categories?main=Cars" },
    secondaryCta: { text: "بِع سيارتك", href: "/sell" },
  }),

  // ===== Location pages (cars for sale by emirate) =====
  en("cars-for-sale-dubai", {
    title: "Cars for Sale in Dubai | Saman Marketplace",
    metaDescription:
      "Cars for sale in Dubai on Saman Marketplace — used and new vehicles listed by owners and dealers across Dubai, with prices in AED, GCC/non-GCC specs, and direct seller contact.",
    h1: "Cars for Sale in Dubai",
    intro:
      "Looking for cars for sale in Dubai? Saman Marketplace lists used and new vehicles from owners and dealers across the city — Toyota, Nissan, Lexus, Mercedes, BMW, Land Rover, Porsche and more. Every listing shows the price in AED, year, mileage, spec, and the seller's contact details.",
    keywords: [
      "cars for sale Dubai",
      "used cars for sale Dubai",
      "Dubai car listings",
      "cars in Dubai",
    ],
    sections: [
      {
        heading: "Browse cars listed in Dubai",
        body: "Filter by make, model, year, body type or price. Every car listing on Saman includes real photos, mileage, GCC or non-GCC spec, and an AED price. Sellers are based in Dubai but you can buy from anywhere in the UAE.",
      },
      {
        heading: "Buy directly from the seller",
        body: "There's no commission and no middleman on Saman. You contact the seller directly through the app — message, call or WhatsApp — and agree the deal yourself.",
      },
      {
        heading: "Selling a car in Dubai",
        body: "If you're the seller, listing your car in Dubai is free during the launch period. Just upload photos, set a price in AED, add the year/mileage/spec, and the listing goes live across the UAE after a quick review.",
      },
    ],
    faqs: [
      { q: "Where can I find cars for sale in Dubai?", a: "Saman Marketplace lists cars for sale in Dubai from individual owners and dealers. You can browse and filter from any device." },
      { q: "Are prices in AED?", a: "Yes, every car price on Saman is shown in AED." },
      { q: "Can I see GCC vs non-GCC spec?", a: "Yes. Every listing is tagged GCC or non-GCC so you can filter before contacting the seller." },
    ],
    primaryCta: { text: "Browse Cars in Dubai", href: "/categories?main=Cars" },
    secondaryCta: { text: "Sell Your Car", href: "/sell" },
    altLangPath: "/cars-for-sale-dubai",
    related: [
      { text: "Cars for sale in Sharjah", href: "/cars-for-sale-sharjah" },
      { text: "Cars for sale in Abu Dhabi", href: "/cars-for-sale-abu-dhabi" },
      { text: "Cars for sale in UAE", href: "/cars-for-sale-uae" },
      { text: "Sell your car in Dubai", href: "/sell-car-dubai" },
      { text: "Used cars in UAE", href: "/used-cars-uae" },
    ],
  }),

  en("cars-for-sale-sharjah", {
    title: "Cars for Sale in Sharjah | Saman Marketplace",
    metaDescription:
      "Cars for sale in Sharjah on Saman Marketplace — used and new vehicles from owners and dealers in Sharjah, with AED prices, GCC/non-GCC spec, and direct seller contact.",
    h1: "Cars for Sale in Sharjah",
    intro:
      "Saman Marketplace lists cars for sale in Sharjah from local owners and dealers. Whether you want a daily driver from Al Nahda, a 4x4 from Industrial Area, or a family SUV from Muwailih, you'll find real listings with photos, AED prices and direct seller contact.",
    keywords: ["cars for sale Sharjah", "used cars Sharjah", "Sharjah car listings"],
    sections: [
      { heading: "Used and new cars in Sharjah", body: "From sedans and SUVs to pickups and 4x4s — Toyota, Nissan, Mitsubishi, Hyundai, Kia, BMW, Mercedes and more — Saman covers the major brands you'll find on Sharjah roads." },
      { heading: "Honest listings, AED prices", body: "Every car shows mileage, year, spec (GCC/non-GCC), photos, and a price in AED. No bait listings, no hidden costs." },
      { heading: "Sell a car in Sharjah", body: "Listing a car for sale in Sharjah on Saman is free. Your ad is visible to buyers across the UAE, not just Sharjah." },
    ],
    faqs: [
      { q: "Where can I find cars for sale in Sharjah?", a: "Saman Marketplace lists cars for sale in Sharjah from owners and dealers, with photos and AED prices." },
      { q: "Can buyers from outside Sharjah see my listing?", a: "Yes. A Sharjah listing is visible to buyers across the UAE." },
    ],
    primaryCta: { text: "Browse Cars in Sharjah", href: "/categories?main=Cars" },
    secondaryCta: { text: "Sell Your Car", href: "/sell" },
    altLangPath: "/cars-for-sale-sharjah",
    related: [
      { text: "Cars for sale in Dubai", href: "/cars-for-sale-dubai" },
      { text: "Cars for sale in Abu Dhabi", href: "/cars-for-sale-abu-dhabi" },
      { text: "Cars for sale in UAE", href: "/cars-for-sale-uae" },
      { text: "Used cars in UAE", href: "/used-cars-uae" },
    ],
  }),

  en("cars-for-sale-abu-dhabi", {
    title: "Cars for Sale in Abu Dhabi | Saman Marketplace",
    metaDescription:
      "Cars for sale in Abu Dhabi on Saman Marketplace — used and new vehicles from owners and dealers in Abu Dhabi, with AED prices, GCC/non-GCC spec, and direct seller contact.",
    h1: "Cars for Sale in Abu Dhabi",
    intro:
      "Saman Marketplace lists cars for sale in Abu Dhabi from owners and dealers across the capital — Khalifa City, Mussafah, Al Reem, Al Raha, and beyond. Browse by make, model, year and price, all in AED, and contact the seller directly.",
    keywords: ["cars for sale Abu Dhabi", "used cars Abu Dhabi", "Abu Dhabi car listings"],
    sections: [
      { heading: "Used and new in Abu Dhabi", body: "Sedans, SUVs, pickups and 4x4s from major brands — Toyota, Nissan, Lexus, Land Rover, Mercedes, BMW, GMC and more — listed by sellers across Abu Dhabi." },
      { heading: "AED prices, real photos", body: "Every Abu Dhabi listing on Saman includes real photos, year, mileage, spec, and a price in AED. No fake leads or middlemen." },
      { heading: "Sell a car in Abu Dhabi", body: "Listing is free during the launch period. Your ad reaches buyers across the UAE from the moment it goes live." },
    ],
    faqs: [
      { q: "Where can I find cars for sale in Abu Dhabi?", a: "Saman Marketplace lists cars for sale in Abu Dhabi from individual owners and dealers." },
      { q: "Are listings GCC spec?", a: "Each listing is tagged GCC or non-GCC so you can filter before contacting the seller." },
    ],
    primaryCta: { text: "Browse Cars in Abu Dhabi", href: "/categories?main=Cars" },
    secondaryCta: { text: "Sell Your Car", href: "/sell" },
    altLangPath: "/cars-for-sale-abu-dhabi",
    related: [
      { text: "Cars for sale in Dubai", href: "/cars-for-sale-dubai" },
      { text: "Cars for sale in Sharjah", href: "/cars-for-sale-sharjah" },
      { text: "Cars for sale in UAE", href: "/cars-for-sale-uae" },
      { text: "Used cars in UAE", href: "/used-cars-uae" },
    ],
  }),

  en("cars-for-sale-uae", {
    title: "Cars for Sale in UAE | Used & New Cars on Saman Marketplace",
    metaDescription:
      "Cars for sale in the UAE on Saman Marketplace. Browse used and new vehicles from owners and dealers across Dubai, Abu Dhabi, Sharjah and the rest of the Emirates — AED prices, direct seller contact.",
    h1: "Cars for Sale in the UAE",
    intro:
      "Saman Marketplace brings cars for sale in the UAE into one app. Used and new vehicles, from city sedans to desert-ready 4x4s, listed by owners and dealers across Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Umm Al Quwain and Fujairah — all with AED prices and direct seller contact.",
    keywords: ["cars for sale UAE", "used cars UAE", "new cars UAE", "UAE car listings"],
    sections: [
      { heading: "One marketplace for the whole UAE", body: "No more jumping between WhatsApp groups, Facebook pages and a dozen websites. Saman lists cars for sale from every emirate in one searchable app." },
      { heading: "Every major brand", body: "Toyota, Nissan, Lexus, Mercedes-Benz, BMW, Audi, Land Rover, Range Rover, Porsche, Honda, Hyundai, Kia, Ford, Chevrolet, Mitsubishi, Infiniti, GMC and more." },
      { heading: "Honest, direct, free", body: "Listings are free during the launch period. There's no commission on sales and no middleman — buyer and seller talk directly through the app." },
    ],
    faqs: [
      { q: "Where can I find cars for sale in the UAE?", a: "Saman Marketplace lists cars for sale across the UAE — Dubai, Abu Dhabi, Sharjah and other emirates — all in one app." },
      { q: "Is Saman free?", a: "Browsing is free for everyone. Posting a car for sale is also free during the launch period and there are no commissions on sales." },
    ],
    primaryCta: { text: "Browse Cars in UAE", href: "/categories?main=Cars" },
    secondaryCta: { text: "Sell Your Car", href: "/sell" },
    altLangPath: "/cars-for-sale-uae",
    related: [
      { text: "Cars for sale in Dubai", href: "/cars-for-sale-dubai" },
      { text: "Cars for sale in Sharjah", href: "/cars-for-sale-sharjah" },
      { text: "Cars for sale in Abu Dhabi", href: "/cars-for-sale-abu-dhabi" },
      { text: "Used cars in UAE", href: "/used-cars-uae" },
      { text: "Sell your car in Dubai", href: "/sell-car-dubai" },
    ],
  }),

  en("sell-car-online-dubai", {
    title: "Sell Your Car Online in Dubai | Free Listings on Saman Marketplace",
    metaDescription:
      "Sell your car online in Dubai on Saman Marketplace. Free listings, AED prices, direct buyer contact, no commissions. Reach UAE buyers in minutes.",
    h1: "Sell Your Car Online in Dubai",
    intro:
      "Selling a car in Dubai shouldn't take weeks or cost a commission. Saman Marketplace lets you sell your car online in Dubai for free — upload photos, set a price in AED, fill in year and mileage, and your listing is live for buyers across the UAE.",
    keywords: ["sell car online Dubai", "sell my car Dubai online", "Dubai online car selling"],
    sections: [
      { heading: "How it works", body: "Create an account, tap +, upload photos, fill in the details (make, model, year, mileage, GCC spec, description), set your price in AED, submit. The listing goes live after a quick review." },
      { heading: "Why sell online with Saman", body: "No commission. No fees per listing. No middleman. Buyers contact you directly through the app, by call or WhatsApp." },
      { heading: "Reach the whole UAE", body: "A Dubai listing is visible to buyers in Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Umm Al Quwain and Fujairah — not just one city." },
    ],
    faqs: [
      { q: "Is it free to sell my car online in Dubai?", a: "Yes — posting your car for sale on Saman is free during the launch period and there are no commissions on the sale." },
      { q: "How long does it take for my listing to go live?", a: "Listings are reviewed by Saman and typically go live within a few hours." },
    ],
    primaryCta: { text: "List Your Car for Free", href: "/sell" },
    secondaryCta: { text: "Browse Cars in Dubai", href: "/cars-for-sale-dubai" },
    altLangPath: "/sell-car-online-dubai",
    related: [
      { text: "Sell your car in Dubai", href: "/sell-car-dubai" },
      { text: "Sell your car online in UAE", href: "/sell-car-online-uae" },
      { text: "Cars for sale in Dubai", href: "/cars-for-sale-dubai" },
      { text: "Sell car parts in UAE", href: "/sell-car-parts-uae" },
    ],
  }),

  en("sell-car-online-uae", {
    title: "Sell Your Car Online in UAE | Free on Saman Marketplace",
    metaDescription:
      "Sell your car online in the UAE on Saman Marketplace. Free listings across Dubai, Abu Dhabi and Sharjah. AED prices, direct contact, no middlemen, no commissions.",
    h1: "Sell Your Car Online in the UAE",
    intro:
      "Saman Marketplace is the simplest way to sell your car online in the UAE. List for free, reach buyers in Dubai, Abu Dhabi, Sharjah and every other emirate, and keep 100% of the sale. No middleman, no commission, no upsells.",
    keywords: ["sell car online UAE", "sell my car UAE online", "UAE online car selling"],
    sections: [
      { heading: "Free and fast", body: "Posting is free during the launch period. Take photos with your phone, set a price in AED, add the basics, and submit — the listing goes live after a quick review." },
      { heading: "Buyer talks to you directly", body: "Buyers reach you through the app, on WhatsApp or by call. No order routing, no fake middlemen — you control the deal." },
      { heading: "Available across the UAE", body: "Saman covers all seven emirates. Sellers in Dubai, Abu Dhabi, Sharjah, Ajman, RAK, UAQ and Fujairah all use the same marketplace." },
    ],
    faqs: [
      { q: "Is selling a car online in the UAE free on Saman?", a: "Yes — posting is free and there are no commissions on the sale during the launch period." },
      { q: "Can I edit or pause my listing?", a: "Yes. You can edit, pause, renew or delete your listing from the My Listings page in the app." },
    ],
    primaryCta: { text: "List Your Car for Free", href: "/sell" },
    secondaryCta: { text: "Browse Cars in UAE", href: "/cars-for-sale-uae" },
    altLangPath: "/sell-car-online-uae",
    related: [
      { text: "Sell your car online in Dubai", href: "/sell-car-online-dubai" },
      { text: "Sell your car in Dubai", href: "/sell-car-dubai" },
      { text: "Cars for sale in UAE", href: "/cars-for-sale-uae" },
      { text: "Sell car parts in UAE", href: "/sell-car-parts-uae" },
    ],
  }),

  // ===== Alternative pages (mention competitors fairly, no claims) =====
  en("dubizzle-alternative-uae", {
    title: "Dubizzle Alternative for Cars and Spare Parts in the UAE | Saman Marketplace",
    metaDescription:
      "Looking for another place to buy and sell cars and car spare parts in the UAE? Saman Marketplace is a UAE-focused automotive marketplace — free listings, AED prices, direct contact with the seller.",
    h1: "Looking for a Dubizzle Alternative in the UAE?",
    intro:
      "If you're looking for another place to list or find cars and car spare parts in the UAE, Saman Marketplace is one of the options. Saman is a UAE-focused automotive marketplace where users post cars, spare parts, wheels, tyres, accessories and other automotive items, with prices in AED and direct contact between buyer and seller.",
    keywords: ["Dubizzle alternative UAE", "alternative to Dubizzle", "UAE automotive marketplace"],
    sections: [
      {
        heading: "What Saman focuses on",
        body: "Saman Marketplace is built specifically for the UAE automotive market — cars and spare parts. It isn't a general classifieds app for furniture or jobs, which keeps the experience focused: faster search, cleaner categories, and listings reviewed before they go live.",
      },
      {
        heading: "How Saman works",
        body: "Browse cars and spare parts by category, make, model or city. Every listing shows the AED price, photos and the seller's contact details. There's no commission on sales and no middleman between buyer and seller.",
      },
      {
        heading: "Free to post during launch",
        body: "During the launch period, posting a listing on Saman is free for both individual sellers and dealers. You keep 100% of the sale.",
      },
    ],
    faqs: [
      { q: "Is Saman the same as Dubizzle?", a: "No. Dubizzle is a general classifieds platform. Saman Marketplace is a separate app focused on cars and car spare parts in the UAE." },
      { q: "Can I post a car for sale on Saman if I already listed it elsewhere?", a: "Yes. You can list your car on Saman in addition to any other platform you use — it's a separate marketplace with its own audience in the UAE." },
      { q: "Does Saman charge commissions?", a: "No, Saman does not charge a commission on sales. Posting is free during the launch period." },
    ],
    primaryCta: { text: "Try Saman — Download App", href: "/downloads" },
    secondaryCta: { text: "Browse Cars in UAE", href: "/cars-for-sale-uae" },
    altLangPath: "/dubizzle-alternative-uae",
    related: [
      { text: "Dubizzle alternative in Dubai", href: "/dubizzle-alternative-dubai" },
      { text: "DubiCars alternative in UAE", href: "/dubicars-alternative-uae" },
      { text: "Cars for sale in UAE", href: "/cars-for-sale-uae" },
      { text: "Used cars in UAE", href: "/used-cars-uae" },
      { text: "Spare parts in Dubai", href: "/spare-parts-dubai" },
    ],
  }),

  en("dubizzle-alternative-dubai", {
    title: "Dubizzle Alternative in Dubai | Saman Marketplace",
    metaDescription:
      "Looking for another platform to buy and sell cars or car spare parts in Dubai? Saman Marketplace is a UAE-focused automotive marketplace with free listings, AED prices and direct seller contact.",
    h1: "Looking for a Dubizzle Alternative in Dubai?",
    intro:
      "If you're searching for another place to list cars or car spare parts in Dubai, Saman Marketplace is one of the options. Saman is a UAE automotive marketplace where users in Dubai post cars, spare parts, wheels, tyres and accessories — with prices in AED and direct contact between buyer and seller.",
    keywords: ["Dubizzle alternative Dubai", "alternative to Dubizzle Dubai", "Dubai automotive marketplace"],
    sections: [
      { heading: "Built for the Dubai automotive market", body: "Saman is focused on cars and car spare parts, which makes it useful for buyers and sellers in Dubai who don't want to scroll through unrelated categories. Listings are reviewed before they go live to keep the marketplace clean." },
      { heading: "How buyers and sellers connect", body: "Sellers post photos, an AED price and contact details. Buyers message, call or WhatsApp directly. There's no order routing and no commission on the sale." },
      { heading: "Free during the launch period", body: "Posting a listing in Dubai is free for individual sellers and dealers. You keep 100% of the sale." },
    ],
    faqs: [
      { q: "Is Saman a Dubizzle competitor?", a: "Saman Marketplace is a separate UAE-focused app for cars and car spare parts. Dubizzle is a general classifieds platform. They are different products run by different companies." },
      { q: "Can dealers in Dubai use Saman?", a: "Yes. Both individual sellers and licensed dealers in Dubai can list cars and spare parts on Saman." },
    ],
    primaryCta: { text: "Try Saman — Download App", href: "/downloads" },
    secondaryCta: { text: "Browse Cars in Dubai", href: "/cars-for-sale-dubai" },
    altLangPath: "/dubizzle-alternative-dubai",
    related: [
      { text: "Dubizzle alternative in UAE", href: "/dubizzle-alternative-uae" },
      { text: "DubiCars alternative in UAE", href: "/dubicars-alternative-uae" },
      { text: "Cars for sale in Dubai", href: "/cars-for-sale-dubai" },
      { text: "Sell your car in Dubai", href: "/sell-car-dubai" },
      { text: "Spare parts in Dubai", href: "/spare-parts-dubai" },
    ],
  }),

  en("dubicars-alternative-uae", {
    title: "DubiCars Alternative for UAE Car Listings | Saman Marketplace",
    metaDescription:
      "Looking for another place to list or find cars in the UAE? Saman Marketplace is a UAE automotive app with free listings, AED prices, direct buyer/seller contact and a focus on cars and spare parts.",
    h1: "Looking for a DubiCars Alternative in the UAE?",
    intro:
      "If you're looking for another platform to buy or sell cars in the UAE, Saman Marketplace is one of the options. Saman is a UAE-focused automotive marketplace covering both cars and spare parts, with prices in AED and direct contact between buyer and seller.",
    keywords: ["DubiCars alternative UAE", "alternative to DubiCars", "UAE car marketplace"],
    sections: [
      { heading: "Cars and spare parts in one app", body: "Saman covers both vehicles and car spare parts, so the same app works for buyers shopping for their next car and for owners looking for parts or accessories." },
      { heading: "Free listings during launch", body: "Posting a car or part on Saman is free during the launch period. There are no commissions on sales and no fees per listing." },
      { heading: "Direct buyer/seller contact", body: "Buyers contact sellers directly through the app, by call or WhatsApp. No middleman, no order routing." },
    ],
    faqs: [
      { q: "Is Saman the same company as DubiCars?", a: "No. Saman Marketplace is a separate product run by a different company. It is a UAE-focused automotive marketplace for both cars and car spare parts." },
      { q: "Can dealers list cars on Saman?", a: "Yes. Both individual sellers and licensed dealers can list cars on Saman." },
    ],
    primaryCta: { text: "Try Saman — Download App", href: "/downloads" },
    secondaryCta: { text: "Browse Cars in UAE", href: "/cars-for-sale-uae" },
    altLangPath: "/dubicars-alternative-uae",
    related: [
      { text: "Dubizzle alternative in UAE", href: "/dubizzle-alternative-uae" },
      { text: "Dubizzle alternative in Dubai", href: "/dubizzle-alternative-dubai" },
      { text: "Cars for sale in UAE", href: "/cars-for-sale-uae" },
      { text: "Used cars in UAE", href: "/used-cars-uae" },
    ],
  }),

  ar("sell-car-dubai", {
    title: "بيع سيارتك في دبي | إعلانات مجانية على سوق سامان",
    metaDescription:
      "بِع سيارتك في دبي مجاناً على سوق سامان. اوصل إلى مشترين في الإمارات في دقائق — تواصل مباشر، بدون وسطاء، بدون عمولات. أسعار بالدرهم.",
    h1: "بِع سيارتك في دبي مجاناً — على سوق سامان",
    intro:
      "إدراج سيارة للبيع في دبي لا يجب أن يكلفك عمولة. سوق سامان يتيح لك بيع سيارتك في دبي مجاناً، مع صور، سعر بالدرهم، المواصفات، الكيلومترات والموقع — ويتواصل معك المشترون مباشرة.",
    keywords: [
      "بيع سيارة دبي",
      "بيع سيارتي دبي",
      "بيع سيارة الإمارات",
    ],
    sections: [
      {
        heading: "لماذا سامان",
        body: "لا عمولة. لا رسوم لإدراج الإعلان. لا وسيط بينك وبين المشتري. أنت تحدد السعر وتقبل العرض وتنهي الصفقة مباشرة.",
      },
      {
        heading: "طريقة العمل",
        body: "أنشئ حساباً، اضغط +، ارفع الصور، أدخل الماركة والموديل والسنة والكيلومترات والمواصفات (خليجي/غير خليجي) ووصفاً مختصراً. ضع السعر بالدرهم. إعلانك يظهر بعد مراجعة سريعة.",
      },
      {
        heading: "وصول للإمارات كلها",
        body: "إعلانك في دبي مرئي لمشترين في أبوظبي والشارقة وعجمان ورأس الخيمة وأم القيوين والفجيرة.",
      },
    ],
    faqs: [
      {
        q: "هل بيع سيارة في دبي على سامان مجاني؟",
        a: "نعم — النشر مجاني خلال فترة الإطلاق ولا توجد عمولات على البيع.",
      },
      {
        q: "متى يظهر إعلان سيارتي؟",
        a: "تُراجَع الإعلانات وتظهر عادة خلال ساعات قليلة.",
      },
    ],
    primaryCta: { text: "أدرج سيارتك مجاناً", href: "/sell" },
    secondaryCta: { text: "تصفّح السيارات", href: "/categories?main=Cars" },
  }),
];

export function findSeoPageByPath(path: string): SeoPage | undefined {
  // normalize: strip trailing slash and query/hash
  const clean = path.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  return SEO_PAGES.find((p) => p.path === clean);
}

export function seoPageAbsoluteUrl(page: SeoPage): string {
  return `${SITE}${page.path}`;
}

export function seoPageAltUrl(page: SeoPage): string {
  return `${SITE}${page.altLangPath}`;
}
