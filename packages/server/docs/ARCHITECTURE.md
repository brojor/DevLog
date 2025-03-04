# Dokumentace serverové části Toggl Auto Tracker

## Přehled

Serverová část projektu Toggl Auto Tracker slouží jako centrální komponenta pro zpracování heartbeatů z klientských rozšíření (VS Code, Chrome) a jejich propojení s Toggl API. Server automaticky vytváří, aktualizuje a ukončuje time entries na základě aktivity uživatele a přijatých Git commitů.

## Adresářová struktura

```
packages/server/
├── src/
│   ├── api/            # API endpointy
│   │   └── routes.ts   # Definice API tras
│   ├── config/         # Konfigurace aplikace
│   │   ├── index.ts    # Hlavní konfigurační soubor
│   │   └── logger.ts   # Konfigurace loggeru
│   ├── middlewares/    # Middlewary pro Express
│   │   └── logger.ts   # HTTP logging middleware
│   ├── services/       # Služby
│   │   ├── togglService.ts        # Komunikace s Toggl API
│   │   └── timeTrackingService.ts # Správa time entries
│   ├── types/          # TypeScript definice
│   │   └── index.ts    # Serverové typy
│   └── index.ts        # Vstupní bod aplikace
├── scripts/            # Utility skripty
│   └── deploy.sh       # Deployment skript
├── dist/               # Buildnutá produkční verze
├── logs/               # Adresář pro logy (vytvoří se při běhu)
├── .env.example        # Šablona pro konfigurační proměnné
├── ecosystem.config.cjs # PM2 konfigurace
├── package.json        # Dependence pro server
├── tsconfig.json       # TypeScript konfigurace
└── vite.config.ts      # Konfigurace buildu
```

## Sdílené typy

V balíčku `packages/shared` jsou definovány typy používané napříč celou aplikací:

### Heartbeat

```typescript
export interface Heartbeat {
  timestamp: number // Časová značka události (unix timestamp)
  source: 'vscode' | 'chrome' // Zdroj heartbeatu
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
}
```

## API Endpointy

Server poskytuje následující API endpointy:

### POST /api/heartbeat

Přijímá heartbeaty z klientských rozšíření, které signalizují aktivitu uživatele.

**Vstup:**
- Objekt typu `Heartbeat`

**Zpracování:**
1. Validace vstupních dat
2. Pokud není aktivní žádný time entry, vytvoří nový
3. Pokud existuje aktivní time entry, aktualizuje čas poslední aktivity
4. Pokud se změnil projekt, ukončí aktuální time entry a vytvoří nový

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
3. Vrací ID aktivní session nebo 0, pokud žádná session není aktivní

**Odpověď:**
- 200 OK - Statistiky byly zpracovány, vrací ID aktivní session
- 400 Bad Request - Chybějící nebo neplatná data
- 500 Internal Server Error - Chyba při zpracování

### POST /api/commit

Přijímá informace o Git commitech, které vedou k ukončení aktuálního time entry a vytvoření nového.

**Vstup:**
- Objekt typu `CommitInfo`

**Zpracování:**
1. Validace vstupních dat
2. Ukončení aktuálního time entry, pokud existuje
3. Aktualizace popisu ukončeného time entry podle commit zprávy
4. Vytvoření nového time entry pro pokračující práci

**Odpověď:**
- 200 OK - Commit byl zpracován
- 400 Bad Request - Chybějící nebo neplatná data
- 500 Internal Server Error - Chyba při zpracování

## Služby

### TogglService

Služba pro komunikaci s Toggl API.

**Metody:**
- `createTimeEntry({ start, description, projectName })` - Vytvoří nový time entry, vrací ID vytvořeného záznamu
- `updateTimeEntry(id, { description, stop, projectName })` - Aktualizuje existující time entry

**Mapování projektů:**
- Služba automaticky mapuje názvy projektů na jejich ID pomocí konfigurace v `config.toggl.projectIdsMap`

### TimeTrackingService

Služba pro správu time entries a zpracování událostí.

**Metody:**
- `processHeartbeat(heartbeat)` - Zpracuje heartbeat z klienta, vrací ID aktivní session
- `processCodeStats(stats)` - Zpracuje statistiky kódu, vrací ID aktivní session nebo 0, pokud není aktivní
- `processCommit(commitInfo)` - Zpracuje informaci o commitu

**Klíčové vlastnosti:**
- Oddělené měření času stráveného v různých prostředích (IDE vs prohlížeč)
- Automatické ukončování sessions při neaktivitě
- Ukončování sessions při změně projektu
- Formátování popisů time entries včetně statistik

## Konfigurace

Konfigurace aplikace je uložena v souboru `.env` a zpracována pomocí modulu `dotenv`.

### Proměnné prostředí

```
# Server nastavení
PORT=3000
NODE_ENV=development

# Toggl API nastavení
TOGGL_API_TOKEN=your_toggl_api_token
TOGGL_WORKSPACE_ID=your_toggl_workspace_id
```

### Konfigurace v kódu

Centralizovaná konfigurace v `src/config/index.ts`:

```typescript
export const config = {
  // Server nastavení
  server: {
    port: env.PORT || 3000,
    env: env.NODE_ENV || 'development',
  },

  // Toggl API nastavení
  toggl: {
    apiUrl: 'https://api.track.toggl.com/api/v9',
    apiToken: env.TOGGL_API_TOKEN || '',
    workspaceId: env.TOGGL_WORKSPACE_ID || '',
    projectIdsMap: {
      'knihozrout': 209468968,
      'toggl-auto-tracker': 209496908,
    },
  },

  // Nastavení aplikace
  app: {
    heartbeatInterval: 5, // v sekundách
    inactivityTimeout: 120, // v sekundách, ukončí time entry po 2 minutách neaktivity
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
import { config } from './index'

// Základní konfigurace pro Pino logger
const loggerConfig: pino.LoggerOptions = {
  level: config.server.env === 'production' ? 'info' : 'debug',
  // V produkčním prostředí používáme jednoduchý formát JSON pro efektivitu
  // V development prostředí používáme pino-pretty pro čitelnější logy
  transport: config.server.env === 'development'
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
    env: config.server.env,
    service: 'toggl-auto-tracker-server',
  },
}

// Vytvoření a export instance loggeru
export const logger = pino(loggerConfig)
```

### HTTP Middleware Logger

```typescript
import { randomUUID } from 'node:crypto'
import pinoHttp from 'pino-http'
import { logger } from '../config/logger'

// Vytvoření middleware pro HTTP logování
export const httpLogger = pinoHttp({
  logger,
  // Generuje unikátní ID pro každý požadavek
  genReqId: (req) => {
    return req.id || randomUUID()
  },
  // Přizpůsobení logovaných atributů
  customProps: (req, res) => {
    return {
      userAgent: req.headers['user-agent'],
      remoteAddress: req.socket.remoteAddress,
    }
  },
  // Úprava úrovně logování na základě stavových kódů HTTP
  customLogLevel: (req, res, err) => {
    if (err || res.statusCode >= 500)
      return 'error'
    if (res.statusCode >= 400)
      return 'warn'
    return 'info'
  },
  // Úprava serializace požadavku včetně těla
  serializers: {
    req: (req) => {
      // Základní informace o požadavku
      const reqInfo = {
        id: req.id,
        method: req.method,
        url: req.url,
        query: req.query,
        params: req.params,
        // Přidání těla požadavku z raw objektu
        body: req.raw?.body
      }

      // Pokud tělo obsahuje citlivé údaje, můžeme je maskovat
      if (reqInfo.body && typeof reqInfo.body === 'object') {
        if (reqInfo.body.password)
          reqInfo.body.password = '[REDACTED]'
        if (reqInfo.body.token)
          reqInfo.body.token = '[REDACTED]'
        if (reqInfo.body.apiToken)
          reqInfo.body.apiToken = '[REDACTED]'
      }

      return reqInfo
    },
  },
  // Automaticky logovat při dokončení odpovědi
  autoLogging: true,
})
```

## Kontrola neaktivity

Služba automaticky ukončuje neaktivní time entries:

1. Při každém heartbeatu je naplánována kontrola neaktivity pomocí `setTimeout`
2. Pokud není detekována aktivita po dobu delší než je nastavený timeout (výchozí 120 sekund), ukončí aktuální time entry
3. Při ukončení time entry je vytvořen popis zahrnující:
   - Čas strávený v IDE
   - Čas strávený v prohlížeči
   - Statistiky o změnách v kódu (pokud jsou dostupné)

## Nasazení

### Konfigurace PM2

Serverová aplikace je nasazena pomocí PM2 process manageru. Konfigurace je v souboru `ecosystem.config.cjs`:

```javascript
module.exports = {
  apps: [
    {
      name: 'toggl-auto-tracker',
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

Pro automatizované nasazení serveru je k dispozici skript `scripts/deploy.sh`:

```bash
#!/bin/bash
# Deployment skript pro Toggl Auto Tracker server

# Konfigurace
SERVER_HOST="n40l"  # Použití SSH aliasu z ~/.ssh/config
SERVER_PATH="/home/brojor/production/toggl-auto-tracker"  # Cesta na serveru
TEMP_DIR="/tmp/toggl-deploy"  # Dočasný adresář pro tarbally

# Funkce pro výpis barevných zpráv
echo_step() {
  echo -e "\033[1;34m>> $1\033[0m"
}

echo_success() {
  echo -e "\033[1;32m✓ $1\033[0m"
}

# Kontrola přítomnosti potřebných nástrojů
command -v jq >/dev/null 2>&1 || { echo >&2 "jq není nainstalován. Nainstalujte ho pomocí 'brew install jq'"; exit 1; }

# 0. Příprava lokálního prostředí
echo_step "Příprava lokálního prostředí..."
mkdir -p $TEMP_DIR
rm -rf $TEMP_DIR/*

# 1. Build aplikace
echo_step "Buildování aplikace..."
pnpm -r --filter="@toggl-auto-tracker/server" build
pnpm -r --filter="@toggl-auto-tracker/shared" build

# 2. Zabalení shared balíčku
echo_step "Zabalení shared balíčku..."
cd ../shared
pnpm pack --pack-destination $TEMP_DIR
SHARED_PACKAGE=$(ls -1 $TEMP_DIR/*.tgz | xargs basename)
cd ../server

# 3. Úprava package.json pro produkční nasazení
echo_step "Úprava package.json pro produkční nasazení..."
jq --arg shared_pkg "file:./$SHARED_PACKAGE" '.dependencies."@toggl-auto-tracker/shared" = $shared_pkg' package.json > $TEMP_DIR/package.json

# 4. Příprava a kopírování souborů na server
echo_step "Příprava a kopírování souborů na server..."
# Vytvoření adresářové struktury na serveru
ssh $SERVER_HOST "mkdir -p $SERVER_PATH/dist $SERVER_PATH/logs"

# Synchronizace souborů v jednom kroku
rsync -rtvz --delete dist/ $SERVER_HOST:$SERVER_PATH/dist/
rsync -rtvz $TEMP_DIR/package.json ecosystem.config.cjs $TEMP_DIR/*.tgz $SERVER_HOST:$SERVER_PATH/

# 5. Instalace závislostí a restart aplikace
echo_step "Instalace závislostí a restart aplikace..."
ssh $SERVER_HOST "cd $SERVER_PATH && pnpm install --prod && pm2 start ecosystem.config.cjs --update-env"

# 6. Úklid
echo_step "Úklid dočasných souborů..."
rm -rf $TEMP_DIR

echo_success "Deployment dokončen!"
```

Použití deployment skriptu:
```bash
cd packages/server
pnpm deploy
```

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
pm2 logs toggl-auto-tracker

# Nebo přímý přístup k log souborům
less /home/brojor/production/toggl-auto-tracker/logs/combined.log
```
