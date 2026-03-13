# RedCardParser

Web-Anwendung zum Parsen, Synchronisieren und Verwalten der RedCard-Partnerdaten des LFV Bayern. Gebaut mit Laravel 12, React, Inertia.js und shadcn/ui.

## Features

- **Dashboard** — Übersicht mit Statistiken, Kategorie-Verteilung und letzten Änderungen
- **Partner-Verwaltung** — Durchsuchbare, filterbare Partnerliste mit Detailansicht
- **Change-Log** — Alle Änderungen an Partnerdaten mit Diff-Ansicht
- **Command-Runner** — Artisan-Commands über die UI ausführen mit Live-Status und Output
- **Export** — Partner- und Änderungsdaten als JSON exportieren
- **Sync-Engine** — Automatisches Parsen der RedCard-Listing-Seite und Detail-Seiten

## Voraussetzungen

- PHP 8.2+
- Node.js 20+
- Composer
- SQLite (Standard) oder MySQL/PostgreSQL

## Installation

```bash
git clone <repo-url> && cd RedCardParser

composer install
npm install

cp .env.example .env
php artisan key:generate

php artisan migrate --seed
```

## Entwicklung

```bash
# Dev-Server starten
npm run dev

# In einem zweiten Terminal
php artisan serve

# Queue-Worker für Command-Runner
php artisan queue:work
```

Die Anwendung ist dann unter `http://localhost:8000` erreichbar.

### Zugangsdaten

| E-Mail              | Passwort   |
|---------------------|------------|
| `test@example.com`  | `password` |

## Artisan-Commands

```bash
# Partnerliste synchronisieren
php artisan redcard:parse-listing [--dry-run] [--local]

# Detail-Seiten abrufen
php artisan redcard:parse-details [--category=] [--only-new] [--limit=50] [--local]

# Vollständiger Sync (Listing + Details)
php artisan redcard:sync [--full] [--details-limit=50] [--local]

# Statistiken anzeigen
php artisan redcard:stats

# Daten exportieren
php artisan redcard:export [--category=] [--changes-since=] [--output=]
```

Alle Commands können auch über die Web-UI unter `/commands` ausgeführt werden.

## Projektstruktur

```
app/
├── Console/Commands/     # Artisan-Commands (parse-listing, parse-details, sync, export, stats)
├── Http/Controllers/     # Dashboard, Partner, ChangeLog, Command, Export
├── Jobs/                 # RunArtisanCommandJob (async Command-Ausführung)
├── Models/               # User, Partner, Category, ChangeLog, CommandRun
└── Services/RedCard/     # SyncService, ExportService, HtmlFetcher, Parser

resources/js/
├── components/           # UI-Komponenten (Sidebar, StatusBadge, ChangeDiff, shadcn/ui)
├── pages/                # Dashboard, Partners, Changes, Commands
├── layouts/              # App- und Auth-Layouts
└── types/                # TypeScript-Typen
```

## Build

```bash
npm run build
```
