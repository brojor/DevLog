# Dokumentace serverové části DevLog

## Přehled

Serverová část projektu DevLog slouží jako centrální komponenta pro zpracování heartbeatů z klientských rozšíření (VS Code, Chrome) a jejich ukládání do Notion databází. Server automaticky vytváří, aktualizuje a ukončuje sessions na základě aktivity uživatele a přijatých Git commitů.

## Adresářová struktura

```
.
├── dist/                # Buildnutá produkční verze
│   └── index.cjs        # Zkompilovaný vstupní bod
├── docs/                # Dokumentace
│   └── ARCHITECTURE.md  # Detailní popis architektury
├── scripts/             # Utility skripty
│   └── deploy.sh        # Deployment skript
├── src/                 # Zdrojový kód
│   ├── api/             # API endpointy
│   │   └── routes.ts    # Definice API tras
│   ├── builders/        # Buildery pro Notion properties
│   │   ├── PagePropertiesBuilder.ts    # Základní builder pro stránky
│   │   ├── ProjectPropertiesBuilder.ts # Builder pro projekty
│   │   ├── SessionPropertiesBuilder.ts # Builder pro sessions
│   │   └── TaskPropertiesBuilder.ts    # Builder pro tasky
│   ├── config/          # Konfigurace aplikace
│   │   ├── index.ts     # Hlavní konfigurační soubor
│   │   └── logger.ts    # Konfigurace loggeru
│   ├── managers/        # Manažeři pro správu jednotlivých entit
│   │   ├── projectManager.ts       # Správa projektů
│   │   ├── sessionManager.ts       # Správa sessions
│   │   └── taskManager.ts          # Správa tasků
│   ├── middlewares/     # Middlewary pro Express
│   │   └── logger.ts    # HTTP logging middleware
│   ├── services/        # Služby
│   │   ├── notionService.ts        # Komunikace s Notion API
│   │   └── timeTrackingService.ts  # Koordinace sledování času
│   ├── types/           # TypeScript definice
│   │   ├── index.ts     # Serverové typy
│   │   └── notion.ts    # Typy pro Notion
│   └── index.ts         # Vstupní bod aplikace
├── README.md            # Dokumentace projektu
├── ecosystem.config.cjs # PM2 konfigurace
├── package.json         # Dependence a skripty projektu
├── tsconfig.json        # TypeScript konfigurace
└── vite.config.ts       # Konfigurace buildu
```

## Sdílené typy

V balíčku `packages/shared` jsou definovány typy používané napříč celou aplikací:

### Heartbeat

```typescript
export enum HeartbeatSource {
  VSCODE = 'vscode',
  CHROME = 'chrome'
}

export interface Heartbeat {
  timestamp: number // Časová značka události (unix timestamp)
  source: HeartbeatSource // Zdroj heartbeatu
  projectName?: string // Název projektu (nepovinné)
}
```

### CodeStats

```typescript
export interface CodeStats {
  filesChanged: number // Počet změněných souborů
  linesAdded: number // Počet přidaných řádků
  linesRemoved: number // Počet odebraných řádků
  timestamp: number // Časová značka (unix timestamp)
}
```

### CommitInfo

```typescript
export interface CommitInfo {
  message: string // Zpráva commitu
  timestamp: number // Časová značka commitu
  hash: string // Hash commitu
  repository: {
    name: string // Název repozitáře
    owner: string // Vlastník repozitáře
  }
}
```

## Architektura

Serverová část DevLog využívá modulární architekturu s jasně oddělenými zodpovědnostmi:

### Služby

1. **NotionService** - Nízkoúrovňová komunikace s Notion API
   - Vytváření a aktualizace záznamů v Notion databázích
   - Vyhledávání projektů podle slugu
   - Počítání sessions v daném časovém období

2. **TimeTrackingService** - Koordinace celého systému
   - Inicializace a koordinace všech manažerů
   - Poskytování jednotného rozhraní pro API kontrolery
   - Zajištění správného toku dat mezi manažery

### Manažeři

1. **SessionManager** - Správa sessions
   - Zpracování heartbeatů z klientských rozšíření
   - Sledování aktivního času v IDE a prohlížeči
   - Automatické ukončování sessions při neaktivitě
   - Aktualizace statistik o změnách v kódu

2. **TaskManager** - Správa tasků
   - Vytváření nových tasků na základě commit informací
   - Propojování ukončených sessions s tasky
   - Parsování commit zpráv pro extrakci názvu a detailů

3. **ProjectManager** - Správa projektů
   - Vyhledávání existujících projektů podle slugu
   - Vytváření nových projektů na základě informací o repozitáři
   - Získávání detailů o repozitáři z GitHub API

## API Endpointy

Server poskytuje následující API endpointy:

### POST /api/heartbeat

Přijímá heartbeaty z klientských rozšíření, které signalizují aktivitu uživatele.

**Vstup:**
- Objekt typu `Heartbeat`

**Zpracování:**
1. Validace vstupních dat
2. Pokud není aktivní žádná session, vytvoří novou
3. Pokud existuje aktivní session, aktualizuje čas poslední aktivity
4. Přidává čas do příslušného čítače (IDE nebo Browser) podle zdroje heartbeatu

**Odpověď:**
- 200 OK - Heartbeat byl zpracován, vrací ID aktivní session
- 400 Bad Request - Chybějící nebo neplatná data
- 500 Internal Server Error - Chyba při zpracování

### POST /api/stats

Přijímá statistiky o změnách v kódu z VS Code rozšíření.

**Vstup:**
- Objekt typu `CodeStats`

**Zpracování:**
1. Validace vstupních dat
2. Aktualizace statistik v aktivní session
3. Statistiky jsou ukládány lokálně a do Notion jsou odeslány až při ukončení session

**Odpověď:**
- 200 OK - Statistiky byly zpracovány
- 400 Bad Request - Chybějící nebo neplatná data
- 500 Internal Server Error - Chyba při zpracování

### POST /api/commit

Přijímá informace o Git commitech, které vedou k ukončení aktuální session a vytvoření nového tasku.

**Vstup:**
- Objekt typu `CommitInfo`

**Zpracování:**
1. Validace vstupních dat
2. Ukončení aktuální session, pokud existuje
3. Vyhledání nebo vytvoření projektu podle informací o repozitáři
4. Vytvoření nového tasku s informacemi z commitu
5. Propojení ukončené session s vytvořeným taskem

**Odpověď:**
- 200 OK - Commit byl zpracován, vrací ID vytvořeného tasku
- 400 Bad Request - Chybějící nebo neplatná data
- 500 Internal Server Error - Chyba při zpracování

## Modelování dat v Notion

DevLog používá tři propojené databáze v Notion:

### Projects

Obsahuje informace o projektech (repozitářích):
- Name - Název projektu
- Slug - Normalizovaný název používaný pro vyhledávání
- Description - Popis projektu z GitHub
- Status - Stav projektu (Active, Completed, On Hold)
- Repository - URL repozitáře
- Start Date - Datum vytvoření projektu
- Tasks - Relation na tasky

### Tasks

Reprezentuje úkoly (commity) s vlastnostmi:
- Name - Název tasku (první řádek commit zprávy)
- Project - Relation na projekt
- Status - Stav úkolu (Not Started, In Progress, Done)
- Commit URL - Odkaz na commit
- Details - Další informace z commit zprávy (vše kromě prvního řádku)
- Due Date - Datum commitu
- Sessions - Relation na sessions

### Sessions

Zaznamenává časové úseky práce:
- Name - Název session ve formátu "Session YYYY-MM #NNN"
- Task - Relation na task
- Date - Časové rozmezí (start-end)
- Ide Time - Čas strávený v IDE (v minutách)
- Browser Time - Čas strávený v prohlížeči (v minutách)
- Files Changed - Počet změněných souborů
- Lines Added - Počet přidaných řádků
- Lines Removed - Počet odebraných řádků

## Konfigurace

Konfigurace aplikace je uložena v souboru `.env` a zpracována pomocí modulu `dotenv`.

### Proměnné prostředí

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

### Konfigurace v kódu

Centralizovaná konfigurace v `src/config/index.ts`:

```typescript
export const appConfig = {
  // Server nastavení
  server: {
    port: env.PORT || 3000,
    env: env.NODE_ENV || 'development',
  },

  // Notion API nastavení
  notion: {
    apiToken: env.NOTION_API_TOKEN || '',
    projectsDatabaseId: env.NOTION_PROJECTS_DATABASE_ID || '',
    tasksDatabaseId: env.NOTION_TASKS_DATABASE_ID || '',
    sessionsDatabaseId: env.NOTION_SESSIONS_DATABASE_ID || '',
  },

  // Nastavení session
  session: {
    heartbeatInterval: 5, // v sekundách
    inactivityTimeout: 120, // v sekundách, ukončí session po 2 minutách neaktivity
  },
}
```

## Logování

Implementováno pomocí strukturovaného loggeru Pino.

### Úrovně logování

- **error** - Chyby aplikace, které vyžadují pozornost
- **warn** - Varování, která nebrání funkčnosti, ale měla by být sledována
- **info** - Běžné informační zprávy o provozu
- **debug** - Detailní informace pro vývoj a ladění

### Konfigurace loggeru

```typescript
import pino from 'pino'
import { appConfig } from './index'

// Základní konfigurace pro Pino logger
const loggerConfig: pino.LoggerOptions = {
  level: appConfig.server.env === 'production' ? 'info' : 'debug',
  // V produkčním prostředí používáme jednoduchý formát JSON pro efektivitu
  // V development prostředí používáme pino-pretty pro čitelnější logy
  transport: appConfig.server.env === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  // Přidáváme základní metadata pro všechny logy
  base: {
    env: appConfig.server.env,
    service: 'devlog-server',
  },
}

// Vytvoření a export instance loggeru
export const logger = pino(loggerConfig)
```

## Kontrola neaktivity

SessionManager automaticky ukončuje neaktivní sessions:

1. Při každém heartbeatu je naplánována kontrola neaktivity pomocí `setTimeout`
2. Pokud není detekována aktivita po dobu delší než je nastavený timeout (výchozí 120 sekund), ukončí aktuální session
3. Při ukončení session je aktualizován záznam v Notion s koncovým časem a všemi statistikami:
   - Čas strávený v IDE (v minutách)
   - Čas strávený v prohlížeči (v minutách)
   - Statistiky o změnách v kódu (filesChanged, linesAdded, linesRemoved)

## Číslování sessions

SessionManager používá sekvenční číslování sessions v rámci každého měsíce:

1. Při inicializaci nebo vytvoření první session získá počet existujících sessions v aktuálním měsíci z Notion
2. Pro každou novou session inkrementuje čítač a používá ho v názvu ve formátu "Session YYYY-MM #NNN"
3. Tento přístup zajišťuje přehledné a chronologické řazení sessions

## Nasazení

### Konfigurace PM2

Serverová aplikace je nasazena pomocí PM2 process manageru. Konfigurace je v souboru `ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [
    {
      name: 'devlog-server',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Konfigurace logů
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      log_file: 'logs/combined.log',
      merge_logs: true,
      // Rotace logů - denní
      time: true,
      // Počet souborů historie, které chceme uchovávat
      max_logs: 30,
    },
  ],
}
```

Tato konfigurace zajišťuje:
- Automatické restartování při pádech
- Omezení paměti pro prevenci memory leaků
- Ukládání a rotace logů do souborů
- Formátování času v logech

### Deployment Skript

Pro automatizované nasazení serveru je k dispozici skript `scripts/deploy.sh`.

### Požadavky na server

Pro správný běh serveru jsou potřeba:

- Node.js 20.10.0 nebo novější
- PM2 instalovaný globálně: `npm install -g pm2`
- pnpm instalovaný globálně: `npm install -g pnpm`

## Spuštění a vývoj

### Vývojové prostředí

```bash
pnpm dev
```

Spustí server s automatickým restartem při změnách v kódu.

### Produkční build

```bash
pnpm build
pnpm start
```

Vytvoří optimalizovanou verzi aplikace a spustí ji.

### Zobrazení logů v produkci

```bash
# Připojit se na server
ssh n40l

# Zobrazit logy z PM2
pm2 logs devlog-server

# Nebo přímý přístup k log souborům
less /home/brojor/production/devlog/logs/combined.log
```
