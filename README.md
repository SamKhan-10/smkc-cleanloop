# SMKC CleanLoop

**REPORT. RESOLVE. VERIFY. PREVENT.**

A geo-verified civic waste reporting, municipal action, ground-verification and repeat-hotspot prevention platform for Sangli, Miraj & Kupwad City Municipal Corporation (SMKC). Built for the SMKC Civic Innovation Forum 2026 — Problem statement: *Smart GVP Detection, Clean-up & Littering Enforcement*.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

The build is a static site (hash routing, relative asset paths) and can be hosted on any static host, or opened from `dist/` via `npm run preview`.

## The closed loop

Citizen report → geo-verified evidence → validation → ward identification → municipal assignment → map-based route optimization → clean-up → ground verification → citizen notification → feedback → repeat-hotspot detection → root-cause investigation → corrective action → continuous monitoring.

## Experiences

| Area | Route | What it does |
|---|---|---|
| Public site | `/#/`, `/#/live`, `/#/rankings`, `/#/how` | Geo-tagged camera entry point, Live Civic Issues feed (cards + map), Ward Cleanliness Rankings, How It Works |
| Citizen Portal | `/#/citizen`, `/#/report` | OTP sign-up with anonymous Citizen ID, geo-tagged camera capture (no gallery upload), AI validation, tracking, notifications, feedback |
| Municipal Command Center | `/#/municipal` | Staff OTP + supporting document sign-in, ward map, priority queue, complaint management, route optimization, repeat hotspots, root-cause investigation, enforcement support, ward analytics |
| Field Verifier | `/#/verifier` | Assigned verifications, navigation, fresh geo-tagged verification photo, before/after comparison, confirm resolution or reopen |

## Demo walkthrough

- **Demo OTP:** `123456` (citizen and staff).
- Every sign-in form has a **"Use demo … details"** shortcut. The demo citizen (`C-10482`) already has three complaints, including a resolved one waiting for feedback.
- **Camera:** uses the device camera when permitted; otherwise a clearly-labelled simulated camera feed is used.
- **GPS:** uses device geolocation when it is inside SMKC limits; otherwise (denied, unavailable, or outside the city) a clearly-labelled simulated in-city position is used. The default simulated position is **Kupwad Weekly Bazaar (Ward 12)**, which already has two earlier reports — the next report there crosses the threshold and triggers **REPEAT HOTSPOT DETECTED**.
- The first new complaint created is **GVP-1284**.
- "Reset demo data" in the footer restores the initial dataset.

## Data & privacy

- All records, statistics, rankings, AI confidence values and route metrics are **demo data / simulated** and are labelled as such in the UI. They are not official SMKC figures, and ward boundaries are simplified illustrative polygons.
- State is held in a connected client-side store (persisted in the browser), so a complaint created by a citizen immediately appears in Live Civic Issues, the map, the municipal dashboard, KPI counts, ward statistics and rankings; status changes by officers and verifiers propagate everywhere.
- Public and municipal views show only anonymous Citizen IDs — never name, email or phone. Staff supporting documents are never displayed.
- Enforcement features produce *recommendations* for municipal review only — no automatic fines or deployments.

## Tech

React 18 + TypeScript, Vite, Tailwind CSS, React Router, Zustand (persisted store / mock service layer), Leaflet (OpenStreetMap/CARTO tiles), Recharts, lucide-react. Languages: English, मराठी, हिंदी.

Key modules: `src/lib/store.ts` (state & actions), `src/lib/seed.ts` (demo data), `src/lib/ai.ts` (priority, duplicate and hotspot signals), `src/lib/hotspots.ts` (repeat-hotspot rule), `src/lib/route.ts` (nearest-neighbour + 2-opt routing), `src/lib/rankings.ts` (ward score), `src/components/GeoCamera.tsx` (geo-tagged camera).
