# Toggl Auto Tracker - Server

## 🚀 Přehled

Serverová část Toggl Auto Tracker slouží jako centrální komponenta systému, která zpracovává heartbeaty z klientských rozšíření (VS Code, Chrome) a propojuje je s Toggl API. Server automaticky vytváří, aktualizuje a ukončuje time entries na základě aktivity uživatele.

## ✨ Funkce

- **Zpracování heartbeatů** z VS Code a Chrome rozšíření
- **Automatická tvorba time entries** v Toggl
- **Detekce neaktivity** a ukončování time entries
- **Zpracování Git commitů** pro aktualizaci popisů time entries
- **Sledování času** stráveného v různých prostředích (IDE vs prohlížeč)
- **Statistiky změn v kódu** včetně počtu změněných souborů a řádků

## 🔧 Požadavky

- Node.js verze 20.10.0 nebo vyšší
- pnpm verze 8.12.0 nebo vyšší
- Toggl účet s API přístupem

## 📦 Instalace

```bash
# Klonování repozitáře
git clone https://github.com/brojor/toggl-auto-tracker.git
cd toggl-auto-tracker

# Instalace závislostí
pnpm install

# Příprava konfigurace
cp packages/server/.env.example packages/server/.env
```

Upravte soubor `.env` podle vašich potřeb:

```
# Server nastavení
PORT=3000
NODE_ENV=development

# Toggl API nastavení
TOGGL_API_TOKEN=your_toggl_api_token
TOGGL_WORKSPACE_ID=your_toggl_workspace_id
```

## 🚀 Spuštění

### Vývojový režim

```bash
# Z kořenového adresáře monorepa
pnpm -F @toggl-auto-tracker/server dev

# Nebo přímo v adresáři serveru
cd packages/server
pnpm dev
```

### Produkční režim

```bash
# Build
pnpm -F @toggl-auto-tracker/server build

# Spuštění
pnpm -F @toggl-auto-tracker/server start
```

## 🌐 API Endpointy

Server poskytuje následující API endpointy:

- **POST /api/heartbeat** - Přijímá heartbeaty z klientských rozšíření
- **POST /api/stats** - Přijímá statistiky o změnách v kódu
- **POST /api/commit** - Přijímá informace o Git commitech

## ⚙️ Konfigurace

Konfigurace serveru je uložena v souboru `.env` a zpracována při startu aplikace. Klíčová nastavení zahrnují:

- **PORT** - Port, na kterém server běží
- **TOGGL_API_TOKEN** - Váš osobní Toggl API token
- **TOGGL_WORKSPACE_ID** - ID vašeho Toggl workspace

## 🔗 Další komponenty

- **[VS Code rozšíření](https://github.com/brojor/toggl-auto-tracker/tree/main/packages/vscode-extension)**: Sledování času v editoru
- **[Chrome rozšíření](https://github.com/brojor/toggl-auto-tracker/tree/main/packages/chrome-extension)**: Sledování času v prohlížeči
