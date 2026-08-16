# Route to Citizenship

A UK immigration **route planner** MVP covering five common paths:

1. **Skilled Worker → ILR → Citizenship**
2. **Family visa (spouse/partner) → ILR → Citizenship**
3. **Student → Graduate → Skilled Worker → ILR → Citizenship**
4. **Global Talent → ILR → Citizenship**
5. **10-year long residence → ILR → Citizenship**

Also included:

- **Absence tracker** — trips vs the 180-day ILR rule and citizenship 90 / 270 / 450-day windows
- **Switching simulator** — stay vs switch onto another MVP route
- **Fee calculator** — Home Office fees from 8 April 2026, plus IHS, ILR, tests and citizenship
- **Document checklist** and reminders

Profiles can be stored in **browser local storage** (guest) or against a **signed-in account** (Prisma / SQLite: User, Profile, VisaEvent, AbsenceRecord, RouteSelection, Reminder).

## This is not immigration advice

The app is a planning aid. It is **not** immigration advice, legal advice, or a Home Office service. Rules and fees change. Confirm everything on [GOV.UK](https://www.gov.uk/browse/visas-immigration) or with an OISC-regulated adviser or solicitor before you apply.

The site-wide footer repeats: *This app provides general information only and does not constitute legal advice. Always check the official GOV.UK website or consult a regulated immigration adviser.*

Each route page shows a **last reviewed** date and links to the official GOV.UK visa, ILR and citizenship pages. Use **Report inaccurate information** if something looks wrong. The planner never asks for passport numbers.

## Develop

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create an account to persist visa history, absences, route selections and reminders.

## Deploy

Guest plans stay in the browser and work on any host. Signed-in accounts use SQLite on disk, so the production target is a **Node.js server or Docker container with a volume** — not a serverless filesystem.

### Docker (recommended)

```bash
export SESSION_SECRET="$(openssl rand -hex 32)"
docker compose up --build -d
```

Then open [http://localhost:3000](http://localhost:3000). The database and session secret persist in the `rtc-data` volume.

A production image is published to GitHub Container Registry on pushes to `main`:

`ghcr.io/duynguyen0106/route-to-citizenship:latest`

```bash
docker run --rm -p 3000:3000 \
  -e SESSION_SECRET="$(openssl rand -hex 32)" \
  -v rtc-data:/data \
  ghcr.io/duynguyen0106/route-to-citizenship:latest
```

The same image can be run on Fly.io, Render, Railway, or a VPS. Keep `/data` on a persistent volume.

### Node.js host

```bash
cp .env.example .env
# Set SESSION_SECRET to a long random value. Keep DATABASE_URL on a writable disk.
npm ci
npx prisma migrate deploy
npm run build
npm run start:prod
```

Do not deploy this SQLite build to Vercel serverless functions: the disk is ephemeral, so signed-in plans would not last. Guest planning would still work.

## Phone app (iOS and Android)

A native Expo app lives in [`mobile/`](./mobile). It reuses the same TypeScript route engine as the website — seven-step onboarding, next 90 days, timeline, checklist, absences and GOV.UK links. Guest plans stay on the phone. Official pages open in the system browser, not an in-app WebView.

```bash
cd mobile
npm install
npx expo start
```

Store binaries are built with EAS (`eas build --platform android|ios`). A Linux host cannot compile a signed iOS IPA locally. A sideloadable Android APK can be built with `mobile/scripts/build-android-apk.sh` (debug keystore — not for Play Store). See [`mobile/README.md`](./mobile/README.md).

Rules encoded in the MVP were last reviewed on **1 August 2026**. Fees follow the Home Office table from **8 April 2026**.
