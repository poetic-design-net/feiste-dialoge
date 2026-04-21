# Feiste Dialoge — Portfolio

Portfolio-Website für Florian Feiste (Dialogbuch · Dramaturgie · Drehbuch).

## Stack

- **Astro 5** — Static Site Generator
- **Tailwind CSS 3** — Styling mit Matcha-Design-System
- **Decap CMS** — Admin-Oberfläche unter `/admin/` (Git-Gateway via GitHub)
- **Vercel** — Hosting (automatischer Build bei Git-Push)

## Lokale Entwicklung

```bash
npm install
npm run dev         # startet Dev-Server auf http://localhost:4321
npm run build       # Typecheck + Produktions-Build nach dist/
npm run preview     # Preview des Builds
```

## Projektstruktur

```
src/
├── content/
│   ├── config.ts            # Schema der Projekte
│   └── projects/*.md        # Projekt-Einträge (editierbar via /admin/)
├── components/               # Wiederverwendbare Astro-Komponenten
├── layouts/BaseLayout.astro  # HTML-Shell, Meta, Header, Footer
├── pages/
│   ├── index.astro           # Startseite
│   ├── portfolio/index.astro # Filmografie
│   ├── portfolio/[slug].astro# Projekt-Detail-Template
│   ├── ueber-mich.astro
│   ├── kontakt.astro
│   ├── impressum.astro
│   └── datenschutz.astro
└── styles/global.css         # Tailwind + eigene Komponenten

public/
├── admin/                    # Decap CMS (index.html + config.yml)
├── favicon.svg
└── robots.txt
```

## Content-Management

Redaktionelle Änderungen über `https://feiste-dialoge.de/admin/` (nach Deploy).

**Einmalige Einrichtung nach dem ersten Deploy auf Vercel:**

1. GitHub OAuth-App erstellen (unter github.com/settings/developers)
   - Callback URL: `https://api.netlify.com/auth/done` (Decap nutzt Netlify als OAuth-Bridge, auch wenn die Seite bei Vercel liegt)
2. Unter netlify.com kostenlos anmelden, ein neues Site-Projekt anlegen, GitHub als Auth-Provider hinterlegen
3. In `public/admin/config.yml` ist der GitHub-Backend bereits vorbereitet

Alternative ohne Netlify: [Decap OAuth Provider](https://github.com/vencax/netlify-cms-github-oauth-provider) selbst hosten (z. B. auch auf Vercel als Serverless-Function).

## Deployment

Git-Push nach `main` → automatischer Vercel-Build. 
`vercel.json` enthält Headers für `/admin/` (noindex) und Assets (Cache).
