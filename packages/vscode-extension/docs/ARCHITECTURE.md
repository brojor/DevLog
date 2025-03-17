# Dokumentace VS Code rozšíření pro DevLog

## Přehled

VS Code rozšíření je klíčovou součástí DevLog systému, které sleduje aktivitu uživatele v editoru a odesílá data na centrální server. Rozšíření pravidelně odesílá heartbeaty, monitoruje stav okna VS Code, sbírá statistiky o změnách v kódu a sleduje Git commity. Nový přístup rozšíření používá časovač pro pravidelné odesílání heartbeatů namísto sledování konkrétních aktivit uživatele, což zvyšuje spolehlivost a snižuje režii systému.

## Adresářová struktura

```
packages/vscode-extension/
├── docs
│   └── ARCHITECTURE.md                          # Detailní popis architektury rozšíření
├── src                                          # Zdrojový kód rozšíření
│   ├── api                                      # Komunikace s externími službami
│   │   └── ApiClient.ts                         # Centrální třída pro komunikaci se serverem
│   ├── installers                               # Komponenty pro instalaci a setup
│   │   └── GitHookInstaller.ts                  # Instalace a správa Git hooks
│   ├── listeners                                # Komponenty reagující na události
│   │   └── CommitEventListener.ts               # Naslouchá Git commit událostem
│   ├── managers                                 # Správci jednotlivých funkcí a zdrojů
│   │   ├── CodeStatsManager.ts                  # Správa odesílání statistik kódu
│   │   ├── GitReferenceManager.ts               # Správa referenčních bodů v Git
│   │   ├── HeartbeatManager.ts                  # Správa odesílání heartbeatů
│   │   └── WindowStateManager.ts                # Sledování stavu okna VS Code
│   ├── providers                                # Poskytovatelé dat a informací
│   │   ├── CodeStatsProvider.ts                 # Generuje statistiky o změnách v kódu
│   │   ├── CommitInfoProvider.ts                # Poskytuje informace o commitech
│   │   └── GitRepositoryProvider.ts             # Přístup k Git repozitářům
│   ├── services                                 # Vysokoúrovňové koordinační služby
│   │   ├── ActivityTrackingService.ts           # Sledování aktivity uživatele
│   │   ├── CodeStatsTrackingService.ts          # Koordinace sledování statistik
│   │   └── CommitTrackingService.ts             # Koordinace sledování commitů
│   ├── types                                    # TypeScript definice a typy
│   │   ├── git.d.ts                             # TypeScript definice pro Git
│   │   └── index.ts                             # Centrální export všech typů
│   ├── utils                                    # Pomocné utility a nástroje
│   │   ├── shell.ts                             # Utility pro práci s příkazy shellu
│   │   └── workspace.ts                         # Utility pro práci s VS Code workspace
│   └── extension.ts                             # Vstupní bod rozšíření, registrace funkcí
├── LICENSE.md                                   # Licenční informace projektu
├── package.json                                 # Konfigurace projektu, závislosti a skripty
├── README.md                                    # Hlavní dokumentace a popis projektu
├── tsconfig.json                                # Konfigurace TypeScript
└── vite.config.ts                               # Konfigurace Vite pro build
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
- Vytváří a spravuje `GitReferenceManager` a `CodeStatsManager`
- Reaguje na změny sessionId z `ApiClient`
- Koordinuje vytváření nových Git referenčních bodů
- Implementuje rozhraní `Disposable` pro správné uvolnění zdrojů

**Hlavní metody:**
- `forceReportStats(reason?)`: Vynutí okamžité odeslání statistik s volitelným důvodem pro log
- `handleSessionChange(newSessionId)`: Zpracovává změnu session ID, vytváří nový referenční bod
- `dispose()`: Uvolní použité zdroje

### 6. GitReferenceManager

Třída `GitReferenceManager` je zodpovědná za vytváření a správu Git referenčních bodů.

**Klíčové funkce:**
- Zaměřuje se výhradně na správu referenčních bodů v Git repozitáři
- Pracuje s konkrétním pracovním adresářem, který je předán při inicializaci
- Ukládá a poskytuje přístup k aktuálnímu referenčnímu hash

**Hlavní metody:**
- `createReferencePoint()`: Vytváří nový referenční bod bez ovlivnění pracovního adresáře
- `referenceHash` (getter): Poskytuje přístup k aktuálnímu referenčnímu hashi

### 7. CodeStatsProvider

Třída `CodeStatsProvider` je zodpovědná za generování statistik o změnách v kódu.

**Klíčové funkce:**
- Specializuje se výhradně na poskytování statistik z git diffu
- Pracuje s konkrétním pracovním adresářem a podporuje filtrování souborů
- Používá Git diff příkazy pro získání statistik

**Hlavní metody:**
- `generateStats(referenceHash)`: Generuje statistiky na základě poskytnutého referenčního hashe
- `parseGitDiffShortstat(diffOutput)`: Parsuje výstup příkazu git diff --shortstat

### 8. CodeStatsManager

Třída `CodeStatsManager` je zodpovědná za správu odesílání statistik o změnách v kódu.

**Klíčové funkce:**
- Používá debouncing mechanismus pro optimalizaci odesílání statistik
- Sleduje události uložení souborů a smazání souborů
- Získává statistiky pouze při významných změnách
- Využívá `GitReferenceManager` a `CodeStatsProvider` pro získání aktuálních statistik
- Využívá `ApiClient` pro odeslání statistik na server

**Hlavní metody:**
- `forceReportStats()`: Vynutí okamžité odeslání statistik
- `reportStats()`: Získá a odešle statistiky kódu
- `dispose()`: Uvolní použité zdroje

### 9. CommitTrackingService

Třída `CommitTrackingService` je zodpovědná za sledování a zpracování Git commit událostí.

**Klíčové funkce:**
- Integruje Git funkcionalitu s DevLog backendem pro sledování commitů
- Obsahuje instance `GitRepositoryProvider`, `CommitInfoProvider`, `GitHookInstaller` a `CommitEventListener`
- Zajišťuje instalaci Git hooků a naslouchání commit událostem
- Zpracovává detekované commity a odesílá informace na server

**Hlavní metody:**
- `initialize()`: Inicializuje Git hook a commit listener
- `handleCommit()`: Zpracovává detekci commitu - získává informace a odesílá je na server
- `dispose()`: Uvolní použité zdroje

### 10. CommitInfoProvider

Třída `CommitInfoProvider` je zodpovědná za poskytování informací o commitech.

**Klíčové funkce:**
- Poskytuje informace o commit událostech z Git repozitáře
- Získává detaily o commit zprávách, hash a časových značkách
- Extrahuje informace o repozitáři pro provázání s projekty

**Hlavní metody:**
- `getCommitInfo(repository, commitHash?)`: Získává informace o commitu
- `getRepositoryInfo(repository)`: Získává informace o repozitáři
- `parseGitRemoteUrl(remoteUrl)`: Parsuje URL repozitáře pro získání vlastníka a názvu

### 11. Utility moduly

**shell.ts**
- Obsahuje funkci `runCommand` pro spouštění shell příkazů
- Zjednodušuje práci s příkazy příkazového řádku

**workspace.ts**
- Obsahuje funkci `getWorkspacePath` pro získání cesty k aktuálnímu workspace
- Centralizuje logiku pro přístup k VS Code workspace API

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
   - `GitReferenceManager` - poskytuje přístup k Git referenčním bodům
   - `CodeStatsManager` - spravuje odesílání statistik kódu

4. **Poskytovatelé dat**:
   - `CodeStatsProvider` - poskytuje statistiky o změnách v kódu
   - `CommitInfoProvider` - poskytuje informace o commitech
   - `GitRepositoryProvider` - poskytuje přístup k Git repozitářům

5. **Tok dat a událostí**:
   - VS Code události (stav okna) -> `WindowStateManager` -> `ActivityTrackingService`
   - Změna stavu okna -> `ActivityTrackingService` -> `HeartbeatManager`/`ApiClient`
   - Uložení souborů/smazání -> `CodeStatsManager` -> `CodeStatsTrackingService`
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
1. `CodeStatsTrackingService` vytváří a spravuje `GitReferenceManager` a `CodeStatsManager`
2. Při změně sessionId vytváří nový referenční bod pomocí `GitReferenceManager`
3. `CodeStatsManager` používá debouncing mechanismus pro sledování změn v kódu
4. Reaguje na události uložení a smazání souborů
5. Po uplynutí debouncing intervalu získává statistiky pomocí `CodeStatsProvider`
6. Statistiky zahrnují počet změněných souborů, přidaných a odebraných řádků
7. Server používá tyto statistiky k obohacení popisků time logs v Notion

### Sledování Git commitů

Rozšíření také automaticky sleduje Git commity v aktuálním repozitáři:
1. `GitHookInstaller` nainstaluje post-commit hook, který aktualizuje signální soubor
2. `CommitEventListener` naslouchá změnám tohoto signálního souboru
3. Při detekci commitu:
   - `CommitTrackingService` zpracuje událost commitu
   - Získá informace o commitu pomocí `CommitInfoProvider` a `GitRepositoryProvider`
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
