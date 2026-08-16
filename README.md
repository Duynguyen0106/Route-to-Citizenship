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

Profiles are stored in **browser local storage** only.

## This is not immigration advice

The app is a planning aid. It is **not** immigration advice, legal advice, or a Home Office service. Rules and fees change. Confirm everything on [GOV.UK](https://www.gov.uk/browse/visas-immigration) or with an OISC-regulated adviser or solicitor before you apply.

## Develop

```bash
npm install
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Rules encoded in the MVP were last reviewed on **1 August 2026**. Fees follow the Home Office table from **8 April 2026**.
