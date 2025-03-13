# DevLog - Server

## 🚀 Přehled

Serverová část DevLog slouží jako centrální komponenta systému, která zpracovává heartbeaty z klientských rozšíření (VS Code, Chrome) a ukládá data do Notion databází. Server automaticky vytváří, aktualizuje a ukončuje sessions na základě aktivity uživatele a propojuje je s tasky a projekty.

## ✨ Funkce

- **Zpracování heartbeatů** z VS Code a Chrome rozšíření
- **Automatická tvorba sessions** v Notion
- **Detekce neaktivity** a ukončování sessions
- **Zpracování Git commitů** pro vytváření tasků a propojení se sessions
- **Získávání projektových informací** z GitHub API
- **Sledování času** stráveného v různých prostředích (IDE vs prohlížeč)
- **Statistiky změn v kódu** včetně počtu změněných souborů a řádků
- **Strukturované logování** včetně logování do souborů v produkci
- **Robustní validace dat** pomocí VineJS schémat

## 🔧 Požadavky

- Node.js verze 20.10.0 nebo vyšší
- pnpm verze 8.12.0 nebo vyšší
- Notion účet s API přístupem
- Vytvořené Notion databáze (Projects, Tasks, Sessions)
- Pro produkční nasazení: PM2 (process manager)
- jq (pro deployment skript)

## 📦 Instalace

```bash
# Klonování repozitáře
git clone https://github.com/brojor/devlog.git
cd devlog

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

# Notion API nastavení
NOTION_API_TOKEN=your_notion_api_token
NOTION_PROJECTS_DATABASE_ID=your_notion_projects_database_id
NOTION_TASKS_DATABASE_ID=your_notion_tasks_database_id
NOTION_SESSIONS_DATABASE_ID=your_notion_sessions_database_id
```

## 🚀 Spuštění

### Vývojový režim

```bash
# Z kořenového adresáře monorepa
pnpm -F @devlog/server dev

# Nebo přímo v adresáři serveru
cd packages/server
pnpm dev
```

### Produkční režim

```bash
# Build
pnpm -F @devlog/server build

# Spuštění
pnpm -F @devlog/server start

# Nebo pomocí PM2
cd packages/server
pm2 start ecosystem.config.cjs
```

## 📋 Nasazení na server

Pro nasazení aplikace na vzdálený server je k dispozici deployment skript:

```bash
# Z adresáře serveru
cd packages/server
pnpm deploy
```

Tento skript:
1. Provede build aplikace
2. Zabalí sdílený balíček do tarballu
3. Upraví package.json pro použití lokálního tarballu místo workspace závislosti
4. Zkopíruje potřebné soubory na server
5. Nainstaluje závislosti
6. Spustí/restartuje aplikaci pomocí PM2

Konfigurace nasazení (server, cesty, atd.) je v souboru `scripts/deploy.sh`.

## 📊 Logování

V produkčním prostředí jsou logy ukládány do souborů v adresáři `logs/`:
- `out.log` - standardní výstup
- `error.log` - chybový výstup
- `combined.log` - kombinované logy

Logy jsou automaticky rotovány (denně) a uchovávány po dobu 30 dní.

Pro zobrazení logů na serveru použijte:
```bash
pm2 logs devlog
```

## 🌐 API Endpointy

Server poskytuje následující API endpointy s robustní validací vstupních dat:

- **POST /api/heartbeat** - Přijímá heartbeaty z klientských rozšíření
- **POST /api/stats** - Přijímá statistiky o změnách v kódu
- **POST /api/commit** - Přijímá informace o Git commitech
- **POST /api/ide/window-state** - Přijímá informace o změnách stavu okna IDE

Všechny endpointy používají validaci pomocí knihovny VineJS, která:
- Kontroluje přítomnost povinných polí
- Validuje typy dat a jejich rozsahy
- Poskytuje přesné chybové zprávy při neplatném vstupu
- Automaticky extrahuje a typuje data pro použití v kódu

## ⚙️ Konfigurace

Konfigurace serveru je uložena v souboru `.env` a zpracována při startu aplikace. Klíčová nastavení zahrnují:

- **PORT** - Port, na kterém server běží
- **NOTION_API_TOKEN** - Váš Notion API token
- **NOTION_PROJECTS_DATABASE_ID** - ID Notion databáze pro projekty
- **NOTION_TASKS_DATABASE_ID** - ID Notion databáze pro tasky
- **NOTION_SESSIONS_DATABASE_ID** - ID Notion databáze pro sessions

### PM2 konfigurace

Konfigurace PM2 pro produkční nasazení je v souboru `ecosystem.config.cjs`. Tento soubor používá CommonJS formát, i když samotná aplikace běží v ESM režimu. Konfigurace definuje:
- Název aplikace
- Cestu ke skriptu
- Nastavení prostředí
- Konfiguraci logování a jejich rotaci

## 🧠 Validace dat

Aplikace používá knihovnu VineJS pro validaci vstupních dat. Pro každý typ dat je definováno validační schéma:

```typescript
import { HeartbeatSource } from '@devlog/shared'
// Příklad pro heartbeat validátor
import vine from '@vinejs/vine'

const heartbeatSchema = vine.object({
  timestamp: vine.number().positive(),
  source: vine.enum(HeartbeatSource),
})

export const heartbeatValidator = vine.compile(heartbeatSchema)
```

Výhody tohoto přístupu:
- Oddělení validace od routovací logiky
- Typová bezpečnost díky TypeScriptu
- Přesné a informativní chybové zprávy
- Možnost snadného rozšíření validačních pravidel

## 🔗 Další komponenty

- **[VS Code rozšíření](https://github.com/brojor/devlog/tree/main/packages/vscode-extension)**: Sledování času v editoru
- **[Chrome rozšíření](https://github.com/brojor/devlog/tree/main/packages/chrome-extension)**: Sledování času v prohlížeči

## 📝 Dokumentace

Podrobnější dokumentaci architektury najdete v souboru [ARCHITECTURE.md](./docs/ARCHITECTURE.md).
