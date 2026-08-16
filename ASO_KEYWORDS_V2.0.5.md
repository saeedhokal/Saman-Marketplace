# App Store ASO — v2.0.5 (Saman Marketplace)

Copy-paste these into App Store Connect → My Apps → Saman Marketplace → v2.0.5 → App Information / Version page. The Keywords field only unlocks when a new version is editable, so do this while preparing the v2.0.5 submission.

---

## English (U.S. / U.K. localization)

**Subtitle** (29/30 chars):
```
UAE Cars & Spare Parts Market
```

**Keywords** (96/100 chars — paste exactly, no spaces after commas):
```
car,auto,buy,sell,sale,used,new,dubai,sharjah,abudhabi,ajman,alain,tyres,rims,engine,accessories
```

Why these: Apple already indexes every word in your app name ("Saman Marketplace") and subtitle ("UAE Cars & Spare Parts Market"), so repeating *cars, spare, parts, uae, marketplace* would waste characters. Competitor app names (dubizzle, dubicars, etc.) are deliberately **not** included — Apple's keyword rules prohibit other companies' names and using them risks App Review rejection. Instead the field targets:
- **Buying/selling intent:** car, auto, buy, sell, sale, used, new
- **All major Emirates & cities:** dubai, sharjah, abudhabi, ajman, alain (uae is already in the subtitle)
- **Parts intent:** tyres, rims, engine, accessories (spare/parts covered by subtitle)

**Promotional Text** (170 char limit, editable anytime — 141 chars):
```
Saman is the UAE's marketplace for cars & spare parts. Buy and sell vehicles, tyres, rims and parts across Dubai, Abu Dhabi, Sharjah & more.
```

---

## Arabic (Saudi Arabia / Arabic localization)

**Subtitle** (29/30 chars):
```
سوق سيارات وقطع غيار الإمارات
```

**Keywords** (94/100 chars — no overlap with the Arabic subtitle, which already covers cars/spare parts/market/UAE):
```
دبي,أبوظبي,الشارقة,عجمان,العين,مستعملة,جديدة,بيع,شراء,اطارات,جنوط,محرك,اكسسوارات,مركبات,شاحنات
```
Covers: Dubai, Abu Dhabi, Sharjah, Ajman, Al Ain, used, new, sell, buy, tyres, rims, engine, accessories, vehicles, trucks.

**Promotional Text (Arabic)** (~111 chars):
```
سمان هو سوق الإمارات للسيارات وقطع الغيار. بيع واشترِ السيارات والإطارات والقطع في دبي وأبوظبي والشارقة والمزيد.
```

---

## Checklist in App Store Connect
1. Open v2.0.5 (must be in an editable state — "Prepare for Submission").
2. English localization: paste Subtitle, Keywords, Promotional Text above.
3. Add/select the Arabic localization and paste the Arabic Subtitle, Keywords, Promotional Text.
4. Save, then submit v2.0.5 — keywords take effect once the version is approved and released.

Notes & compliance:
- Keywords are never shown to users; only Apple's search uses them.
- No competitor app/brand names anywhere — Apple prohibits them in keywords and metadata.
- No term is duplicated between a localization's name/subtitle and its keywords field.
- All strings validated against limits: Subtitle ≤ 30 chars, Keywords ≤ 100 chars, Promotional Text ≤ 170 chars (both locales).
- Promotional Text can be changed later without a new version — keywords and subtitle cannot.
- Don't add spaces after commas in the keywords field; they waste characters.
