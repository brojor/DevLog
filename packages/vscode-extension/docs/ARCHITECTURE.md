# Dokumentace VS Code rozšíření pro DevLog

## Přehled

VS Code rozšíření je klíčovou součástí DevLog systému, které sleduje aktivitu uživatele v editoru a odesílá data na centrální server. Rozšíření pravidelně odesílá heartbeaty, monitoruje stav okna VS Code, sbírá statistiky o změnách v kódu a sleduje Git commity. Nový přístup rozšíření používá časovač pro pravidelné odesílání heartbeatů namísto sledování konkrétních aktivit uživatele, což zvyšuje spolehlivost a snižuje režii systému.

## Adresářová struktura

```
packages/vscode-extension/
├── src/
│   ├── extension.ts             # Hlavní vstupní bod rozšíření
│   ├── ApiClient.ts             # Třída pro komunikaci se serverem
│   ├── HeartbeatManager.ts      # Třída pro správu pravidelných heartbeatů
│   ├── WindowStateManager.ts    # Třída pro sledování stavu okna VS Code
│   ├── GitStashManager.ts       # Třída pro správu Git stash hashů a statistik kódu
│   ├── GitHookInstaller.ts      # Třída pro instalaci Git hooků
│   ├── CommitEventListener.ts   # Třída pro naslouchání commit událostem
│   ├── CommitEventService.ts    # Služba pro detekci a zpracování commit událostí
│   ├── CommitInfoService.ts     # Služba pro získávání informací o commitech
│   ├── GitRepositoryProvider.ts # Poskytovatel přístupu k Git repozitářům
│   ├── GitIntegrationService.ts # Služba koordinující Git funkcionalitu
│   ├── StatsReporter.ts         # Třída pro pravidelné odesílání statistik
│   ├── SessionManager.ts        # Třída pro správu sessions
│   └── types/                   # TypeScript definice a typy
├── .vscodeignore               # Soubory ignorované při publikování
├── package.json                # Metadata a konfigurace rozšíření
├── tsconfig.json               # Konfigurace TypeScript
└── vite.config.ts              # Konfigurace Vite pro build
```

## Klíčové komponenty

### 1. HeartbeatManager

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

### 2. WindowStateManager

Třída `WindowStateManager` je zodpovědná za sledování stavu okna VS Code (aktivní/neaktivní, fokus).

**Klíčové funkce:**
- Sleduje události změny stavu okna VS Code
- Odesílá informace o změnách stavu okna na server
- Informuje ostatní komponenty o změnách stavu pomocí callback funkce
- Implementuje rozhraní `Disposable` pro správné uvolnění zdrojů

**Hlavní metody:**
- `onStateChange(callback)`: Nastavuje callback, který bude volán při každé změně stavu okna
- `handleWindowStateChange(e)`: Zpracovává změnu stavu okna
- `sendWindowState()`: Odesílá aktuální stav okna na server
- `state` (getter): Poskytuje aktuální stav okna

### 3. ApiClient

Třída `ApiClient` zajišťuje komunikaci s centrálním serverem.

**Hlavní metody:**
- `sendHeartbeat(data)`: Odesílá heartbeat data na server
- `sendStats(data)`: Odesílá statistiky o změnách v kódu na server
- `sendCommitInfo(commitInfo)`: Odesílá informace o commitu na server
- `sendWindowState(windowStateEvent)`: Odesílá informace o stavu okna na server

**Implementační detaily:**
- Získává URL serveru z konfigurace rozšíření
- Odesílá data pomocí HTTP POST požadavku
- Správa identifikátoru session (sessionId)
- Ošetřuje chyby při komunikaci se serverem
- Vrací Promise pro asynchronní operace
- Používá typované rozhraní pro odesílaná data

### 4. GitStashManager

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

### 5. GitHookInstaller

Třída `GitHookInstaller` je zodpovědná za instalaci Git post-commit hooků v repozitáři.

**Hlavní metody:**
- `installPostCommitHook()`: Instaluje post-commit hook do repozitáře

**Implementační detaily:**
- Vytváří Git hook skripty, které aktualizují signální soubor `.git/.commit.done`
- Zachovává existující funkcionalitu hooků, pokud už existují
- Zajišťuje, že hook má správná oprávnění pro spuštění

### 6. CommitEventListener

Třída `CommitEventListener` naslouchá změnám signálního souboru a detekuje Git commity.

**Klíčové funkce:**
- Zajišťuje existenci signálního souboru `.git/.commit.done`
- Sleduje změny tohoto souboru
- Notifikuje o nových commitech přes callback funkci

**Hlavní metody:**
- `initialize()`: Připraví signální soubor a spustí sledování
- `dispose()`: Uvolní použité zdroje

### 7. CommitEventService

Třída `CommitEventService` koordinuje detekci Git commit událostí.

**Klíčové funkce:**
- Inicializuje `GitHookInstaller` pro nastavení Git hook
- Spravuje `CommitEventListener` pro detekci změn
- Poskytuje rozhraní pro registraci callback funkcí

**Hlavní metody:**
- `initialize()`: Inicializuje potřebné komponenty
- `setCommitCallback(callback)`: Nastavuje callback pro commit události
- `dispose()`: Uvolní použité zdroje

### 8. CommitInfoService

Třída `CommitInfoService` získává strukturované informace o Git commitech.

**Klíčové funkce:**
- Extrahuje informace o commitu z Git repozitáře
- Získává informace o repozitáři (owner, name)
- Transformuje data do formátu `CommitInfo`

**Hlavní metody:**
- `getCommitInfo(repository, commitHash?)`: Získává informace o konkrétním commitu nebo HEAD

### 9. GitRepositoryProvider

Třída `GitRepositoryProvider` poskytuje přístup k Git repozitářům.

**Klíčové funkce:**
- Inicializuje VS Code Git API
- Poskytuje přístup k aktuálnímu repozitáři

**Hlavní metody:**
- `getActiveRepository()`: Získává aktivní repozitář

### 10. GitIntegrationService

Třída `GitIntegrationService` koordinuje Git funkcionalitu a integraci s API.

**Klíčové funkce:**
- Inicializuje všechny potřebné Git služby
- Reaguje na commit události
- Získává informace o commitech a odesílá je na server

**Hlavní metody:**
- `initialize()`: Inicializuje Git integraci a nastavuje naslouchání commit událostem
- `dispose()`: Uvolní použité zdroje

### 11. StatsReporter

Třída `StatsReporter` je zodpovědná za pravidelné odesílání statistik o změnách v kódu.

**Klíčové funkce:**
- Implementuje periodické odesílání statistik pomocí `setInterval`
- Sleduje události uložení souborů (`onDidSaveTextDocument`)
- Odesílá statistiky pouze když došlo k uložení souboru od posledního odeslání
- Využívá `GitStashManager` pro získání aktuálních statistik
- Využívá `ApiClient` pro odeslání statistik na server

**Hlavní metody:**
- `start()`: Spustí pravidelné odesílání statistik
- `stop()`: Zastaví pravidelné odesílání statistik
- `reportStats()`: Získá a odešle statistiky, pokud došlo k uložení souboru

### 12. SessionManager

Třída `SessionManager` je zodpovědná za správu sessions, včetně vytváření nových sessions při změně sessionId.

**Klíčové funkce:**
- Reaguje na změny sessionId z API
- Koordinuje vytváření nových Git stash hashů
- Implementuje rozhraní `Disposable` pro správné uvolnění zdrojů

**Hlavní metody:**
- `handleSessionChange(newSessionId)`: Zpracovává změnu session ID
- `dispose()`: Uvolní použité zdroje

## Hlavní funkcionalita

### Heartbeat mechanismus

Rozšíření používá pravidelné heartbeaty namísto sledování konkrétních aktivit:
1. `HeartbeatManager` nastavuje interval pomocí `TIME_CONSTANTS.IDE_HEARTBEAT_INTERVAL_MS` (10 sekund)
2. Heartbeaty jsou odesílány pouze když je okno VS Code aktivní a má fokus
3. Heartbeaty obsahují základní informace (timestamp, zdroj)
4. Server používá heartbeaty pro detekci aktivních sessions

### Sledování stavu okna

Rozšíření monitoruje stav okna VS Code, což umožňuje:
1. Odesílat heartbeaty pouze když je okno aktivní
2. Informovat server o změnách stavu okna (aktivní/neaktivní, fokus)
3. Detekovat přepínání mezi různými aplikacemi
4. Optimalizovat využití síťových prostředků

### Sledování statistik o změnách v kódu

Rozšíření sbírá a odesílá statistiky o změnách v kódu efektivním způsobem:
1. Při inicializaci vytvoří referenční bod pomocí Git stash hashe
2. Nastaví pravidelný interval pro potenciální odeslání statistik
3. Sleduje události uložení souborů a nastavuje příznak při každém uložení
4. Statistiky skutečně získává a odesílá pouze když:
   - Uplynul nastavený interval
   - Od posledního odeslání byl uložen alespoň jeden soubor
5. Statistiky zahrnují počet změněných souborů, přidaných a odebraných řádků
6. Server používá tyto statistiky k obohacení popisků time logs v Notion

### Sledování Git commitů

Rozšíření také automaticky sleduje Git commity v aktuálním repozitáři:
1. `GitHookInstaller` nainstaluje post-commit hook, který aktualizuje signální soubor `.git/.commit.done`
2. `CommitEventListener` naslouchá změnám tohoto signálního souboru
3. Při detekci commitu:
   - `CommitEventService` vyvolá nastavený callback
   - `GitIntegrationService` získá informace o commitu pomocí `CommitInfoService`
   - Informace o commitu jsou odeslány na server pomocí `ApiClient`
4. Server použije tyto informace pro vytvoření nového záznamu v Notion

## Architektura Git podpory

Nová implementace Git podpory využívá zlepšenou architekturu:

1. **GitRepositoryProvider** - poskytuje přístup k Git repozitářům
2. **CommitEventListener** - detekuje commit události pomocí signálního souboru
3. **CommitEventService** - koordinuje detekci a zpracování commit událostí
4. **CommitInfoService** - získává strukturované informace o commitech
5. **GitIntegrationService** - koordinuje Git služby a integraci s API

Tato architektura respektuje SOLID principy:
- Každá třída má jednu jasně definovanou odpovědnost
- Závislosti jsou jasně definované a předávané
- Kód je lépe testovatelný a udržovatelný

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
