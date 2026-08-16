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

Rules encoded in the MVP were last reviewed on **1 August 2026**. Fees follow the Home Office table from **8 April 2026**.
