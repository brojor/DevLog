# Dokumentace VS Code rozšíření pro DevLog

## Přehled

VS Code rozšíření je klíčovou součástí DevLog systému, které sleduje aktivitu uživatele v editoru a odesílá data na centrální server. Rozšíření pravidelně odesílá heartbeaty, monitoruje stav okna VS Code, sbírá statistiky o změnách v kódu a sleduje Git commity. Nový přístup rozšíření používá časovač pro pravidelné odesílání heartbeatů namísto sledování konkrétních aktivit uživatele, což zvyšuje spolehlivost a snižuje režii systému.

## Adresářová struktura

```
packages/vscode-extension/
├── src/
│   ├── extension.ts             # Hlavní vstupní bod rozšíření
│   ├── ApiClient.ts             # Třída pro komunikaci se serverem
│   ├── ActivityTrackingService.ts # Služba pro sledování aktivity v VS Code
│   ├── HeartbeatManager.ts      # Třída pro správu pravidelných heartbeatů
│   ├── WindowStateManager.ts    # Třída pro sledování stavu okna VS Code
│   ├── GitStashManager.ts       # Třída pro správu Git stash hashů a statistik kódu
│   ├── GitHookInstaller.ts      # Třída pro instalaci Git hooků
│   ├── CommitEventListener.ts   # Třída pro naslouchání commit událostem
│   ├── CommitTrackingService.ts # Služba pro sledování a zpracování commit událostí
│   ├── CommitInfoService.ts     # Služba pro získávání informací o commitech
│   ├── GitRepositoryProvider.ts # Poskytovatel přístupu k Git repozitářům
│   ├── StatsReporter.ts         # Třída pro reportování statistik kódu
│   ├── CodeStatsTrackingService.ts # Služba pro sledování a správu statistik kódu
│   └── types/                   # TypeScript definice a typy
├── .vscodeignore               # Soubory ignorované při publikování
├── package.json                # Metadata a konfigurace rozšíření
├── tsconfig.json               # Konfigurace TypeScript
└── vite.config.ts              # Konfigurace Vite pro build
```

## Klíčové komponenty

### 1. ApiClient

Třída `ApiClient` zajišťuje komunikaci s centrálním serverem.

**Klíčové funkce:**
- Implementuje rozhraní `vscode.Disposable`
- Zajišťuje odeslání všech typů dat na server
- Emituje události o změnách sessionId
- Obsahuje validaci URL serveru

**Hlavní metody:**
- `sendHeartbeat(data)`: Odesílá heartbeat data na server
- `sendStats(data)`: Odesílá statistiky o změnách v kódu na server
- `sendCommitInfo(commitInfo)`: Odesílá informace o commitu na server
- `sendWindowState(windowStateEvent)`: Odesílá informace o stavu okna na server
- `dispose()`: Uvolňuje použité zdroje

**Implementační detaily:**
- Získává URL serveru z konfigurace rozšíření
- Odesílá data pomocí HTTP POST požadavku
- Správa identifikátoru session (sessionId)
- Ošetřuje chyby při komunikaci se serverem
- Vrací Promise pro asynchronní operace
- Používá typované rozhraní pro odesílaná data

### 2. ActivityTrackingService

Služba `ActivityTrackingService` koordinuje sledování aktivity uživatele v VS Code.

**Klíčové funkce:**
- Propojuje WindowStateManager a HeartbeatManager
- Zpracovává změny stavu okna VS Code
- Aktivuje/deaktivuje odesílání heartbeatů podle stavu okna
- Odesílá informace o stavu okna na server
- Implementuje rozhraní `vscode.Disposable`

**Hlavní metody:**
- `handleWindowStateChange(state)`: Zpracovává změny stavu okna
- `sendWindowState(state)`: Odesílá stav okna na server
- `dispose()`: Uvolňuje použité zdroje

### 3. WindowStateManager

Třída `WindowStateManager` je zodpovědná za sledování stavu okna VS Code (aktivní/neaktivní, fokus).

**Klíčové funkce:**
- Sleduje události změny stavu okna VS Code
- Používá EventEmitter pro notifikace o změnách stavu
- Implementuje rozhraní `Disposable` pro správné uvolnění zdrojů
- Poskytuje přístup k aktuálnímu stavu okna

**Hlavní metody:**
- `onStateChange`: Event poskytující notifikace při změně stavu okna
- `handleWindowStateChange(e)`: Zpracovává změnu stavu okna
- `state` (getter): Poskytuje aktuální stav okna
- `dispose()`: Uvolní použité zdroje

### 4. HeartbeatManager

Třída `HeartbeatManager` je zodpovědná za pravidelné odesílání heartbeatů na server.

**Klíčové funkce:**
- Vytváří a spravuje interval pro pravidelné odesílání heartbeatů
- Aktivuje/deaktivuje odesílání heartbeatů na základě stavu okna VS Code
- Používá konstantu `TIME_CONSTANTS.IDE_HEARTBEAT_INTERVAL_MS` ze sdílených konstant pro nastavení intervalu
- Implementuje rozhraní `Disposable` pro správné uvolnění zdrojů

**Hlavní metody:**
- `setEnabled(enabled)`: Povoluje nebo zakazuje odesílání heartbeatů
- `sendHeartbeat()`: Odešle aktuální heartbeat na server
- `dispose()`: Uvolní zdroje (vyčistí interval)

### 5. CodeStatsTrackingService

Třída `CodeStatsTrackingService` je zodpovědná za koordinaci sledování statistik kódu.

**Klíčové funkce:**
- Vytváří a spravuje `GitStashManager` a `StatsReporter`
- Reaguje na změny sessionId z `ApiClient`
- Koordinuje vytváření nových Git stash hashů
- Implementuje rozhraní `Disposable` pro správné uvolnění zdrojů

**Hlavní metody:**
- `forceReportStats(reason?)`: Vynutí okamžité odeslání statistik s volitelným důvodem pro log
- `handleSessionChange(newSessionId)`: Zpracovává změnu session ID, vytváří nový stash hash
- `dispose()`: Uvolní použité zdroje

### 6. GitStashManager

Třída `GitStashManager` je zodpovědná za správu Git stash hashů a získávání statistik o změnách v kódu.

**Hlavní metody:**
- `createStashHash()`: Vytváří nový stash hash bez ovlivnění pracovního adresáře
- `getStashHash()`: Vrací aktuálně používaný stash hash
- `getDiffStats()`: Získává statistiky o změnách v kódu oproti referenčnímu stash hashi

**Implementační detaily:**
- Pracuje s Git příkazy pomocí Node.js child_process
- Používá `git stash create` pro vytvoření referenčního bodu bez ovlivnění pracovního adresáře
- Používá `git diff --shortstat` pro získání statistik o změnách
- Podporuje filtrování souborů, které nemají být zahrnuty do statistik (např. lock soubory)
- Při absenci změn používá HEAD jako referenční bod

### 7. StatsReporter

Třída `StatsReporter` je zodpovědná za získávání a odesílání statistik o změnách v kódu.

**Klíčové funkce:**
- Používá debouncing mechanismus pro optimalizaci odesílání statistik
- Sleduje události uložení souborů a smazání souborů
- Získává statistiky pouze při významných změnách
- Využívá `GitStashManager` pro získání aktuálních statistik
- Využívá `ApiClient` pro odeslání statistik na server

**Hlavní metody:**
- `forceReportStats()`: Vynutí okamžité odeslání statistik
- `reportStats()`: Získá a odešle statistiky kódu
- `dispose()`: Uvolní použité zdroje

### 8. CommitTrackingService

Třída `CommitTrackingService` je zodpovědná za sledování a zpracování Git commit událostí.

**Klíčové funkce:**
- Integruje Git funkcionalitu s DevLog backendem pro sledování commitů
- Obsahuje instance `GitRepositoryProvider`, `CommitInfoService`, `GitHookInstaller` a `CommitEventListener`
- Zajišťuje instalaci Git hooků a naslouchání commit událostem
- Zpracovává detekované commity a odesílá informace na server

**Hlavní metody:**
- `initialize()`: Inicializuje Git hook a commit listener
- `handleCommit()`: Zpracovává detekci commitu - získává informace a odesílá je na server
- `dispose()`: Uvolní použité zdroje

## Architektura

Rozšíření používá modulární architekturu s jasně oddělenými zodpovědnostmi:

1. **Hlavní služby** (high-level):
   - `ActivityTrackingService` - zodpovědná za sledování aktivity v VS Code a řízení heartbeatů
   - `CodeStatsTrackingService` - zodpovědná za sledování a reportování statistik kódu
   - `CommitTrackingService` - zodpovědná za sledování Git commitů

2. **Komunikační vrstva**:
   - `ApiClient` - centrální bod pro komunikaci se serverem, implementuje `Disposable`

3. **Správci funkcí** (low-level):
   - `WindowStateManager` - sleduje stav okna VS Code a emituje události
   - `HeartbeatManager` - zajišťuje pravidelné odesílání heartbeatů
   - `GitStashManager` - poskytuje přístup k Git statistikám
   - `StatsReporter` - reportuje statistiky kódu

4. **Tok dat a událostí**:
   - VS Code události (stav okna) -> `WindowStateManager` -> `ActivityTrackingService`
   - Změna stavu okna -> `ActivityTrackingService` -> `HeartbeatManager`/`ApiClient`
   - Uložení souborů/smazání -> `StatsReporter` -> `CodeStatsTrackingService`
   - Git commit -> `CommitEventListener` -> `CommitTrackingService` -> `ApiClient`

Tato architektura dodržuje několik důležitých principů:

1. **Jednotná odpovědnost (SRP)** - Každá třída má jasně definovanou jednu zodpovědnost
2. **Injekce závislostí (DI)** - Závislosti jsou předávány v konstruktoru
3. **Efektivní správa zdrojů** - Všechny třídy implementují `Disposable` pro uvolnění zdrojů
4. **Event-driven přístup** - Služby reagují na události (změna stavu okna, uložení souboru)
5. **High-level koordinátoři** - Hlavní služby koordinují low-level managery a poskytují jednotný interface

## Hlavní funkcionalita

### Sledování aktivity v VS Code

Rozšíření monitoruje aktivitu v VS Code:
1. `WindowStateManager` sleduje stav okna (aktivní/neaktivní, fokus/bez fokusu)
2. `ActivityTrackingService` koordinuje aktivity na základě změn stavu
3. Aktivace/deaktivace odesílání heartbeatů podle stavu okna
4. Odesílání informací o stavu okna na server pro sledování času

### Heartbeat mechanismus

Rozšíření používá pravidelné heartbeaty namísto sledování konkrétních aktivit:
1. `HeartbeatManager` nastavuje interval pomocí `TIME_CONSTANTS.IDE_HEARTBEAT_INTERVAL_MS` (10 sekund)
2. Heartbeaty jsou odesílány pouze když je okno VS Code aktivní a má fokus
3. Heartbeaty obsahují základní informace (timestamp, zdroj)
4. Server používá heartbeaty pro detekci aktivních sessions

### Sledování statistik o změnách v kódu

Rozšíření sbírá a odesílá statistiky o změnách v kódu efektivním způsobem:
1. `CodeStatsTrackingService` vytváří a spravuje `GitStashManager` a `StatsReporter`
2. Při změně sessionId vytváří nový referenční bod pomocí Git stash hashe
3. `StatsReporter` používá debouncing mechanismus pro sledování změn v kódu
4. Reaguje na události uložení a smazání souborů
5. Po uplynutí debouncing intervalu získává a odesílá statistiky o změnách
6. Statistiky zahrnují počet změněných souborů, přidaných a odebraných řádků
7. Server používá tyto statistiky k obohacení popisků time logs v Notion

### Sledování Git commitů

Rozšíření také automaticky sleduje Git commity v aktuálním repozitáři:
1. `GitHookInstaller` nainstaluje post-commit hook, který aktualizuje signální soubor
2. `CommitEventListener` naslouchá změnám tohoto signálního souboru
3. Při detekci commitu:
   - `CommitTrackingService` zpracuje událost commitu
   - Získá informace o commitu pomocí `CommitInfoService` a `GitRepositoryProvider`
   - Informace o commitu jsou odeslány na server pomocí `ApiClient`
4. Server použije tyto informace pro vytvoření nového záznamu v Notion

## Konfigurace

Rozšíření lze konfigurovat přes nastavení VS Code:

```json
{
  "devlog.serverUrl": "http://localhost:3000"
}
```

Tato hodnota určuje URL centrálního serveru, na který jsou odesílány heartbeaty a statistiky.

## Sdílené konstanty

Pro konzistentnost napříč různými částmi aplikace jsou definovány sdílené konstanty:

```typescript
export const TIME_CONSTANTS = {
  // Interval mezi heartbeaty v milisekundách (10 sekund)
  IDE_HEARTBEAT_INTERVAL_MS: 10 * 1000,

  // Timeout pro detekci neaktivity uživatele v milisekundách (2 minuty)
  INACTIVITY_TIMEOUT_MS: 2 * 60 * 1000,

  // Interval pro debouncing odesílání statistik kódu v milisekundách (15 sekund)
  CODE_STATS_REPORT_DEBOUNCE_MS: 15 * 1000,
}
```

## Build a nasazení

### Vývojové prostředí

```bash
pnpm dev
```

Spustí Vite v režimu sledování, který automaticky překompiluje soubory při změnách.

### Produkční build

```bash
pnpm package
```

Vytvoří optimalizovaný build rozšíření a zabalí ho do VSIX souboru, který lze nainstalovat do VS Code nebo publikovat do VS Code Marketplace.

## Technologický stack

- TypeScript pro typově bezpečný kód
- VS Code API pro interakci s editorem
- Vite pro bundlování a optimalizaci kódu
- Fetch API pro komunikaci se serverem
- Node.js child_process pro interakci s Gitem
- Node.js fs/promises API pro práci se souborovým systémem
- Git hooks pro zachycení commit událostí
