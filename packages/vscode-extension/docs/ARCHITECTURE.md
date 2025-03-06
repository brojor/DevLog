# Dokumentace VS Code rozšíření pro Toggl Auto Tracker

## Přehled

VS Code rozšíření je klíčovou součástí Toggl Auto Tracker systému, které sleduje aktivitu uživatele v editoru a odesílá data na centrální server. Rozšíření detekuje různé typy aktivit, identifikuje aktuální projekt, poskytuje možnost dočasně pozastavit sledování a sbírá statistiky o změnách v kódu.

## Adresářová struktura

```
packages/vscode-extension/
├── src/
│   ├── extension.ts         # Hlavní vstupní bod rozšíření
│   ├── ActivityTracker.ts   # Třída pro sledování aktivity uživatele
│   ├── ApiClient.ts         # Třída pro komunikaci se serverem
│   ├── GitStashManager.ts   # Třída pro správu Git stash hashů a statistik kódu
│   ├── StatsReporter.ts     # Třída pro pravidelné odesílání statistik
│   ├── SessionManager.ts    # Třída pro správu sessions
│   └── StatusBarItem.ts     # Třída pro ovládání položky ve status baru
├── .vscodeignore            # Soubory ignorované při publikování
├── package.json             # Metadata a konfigurace rozšíření
├── tsconfig.json            # Konfigurace TypeScript
└── vite.config.ts           # Konfigurace Vite pro build
```

## Klíčové komponenty

### 1. ActivityTracker

Třída `ActivityTracker` je zodpovědná za sledování aktivity uživatele v editoru.

**Sledované aktivity:**
- Úpravy textu (psaní, mazání)
- Přepínání mezi soubory
- Změny výběru textu
- Přepínání záložek/editorů
- Scrollování

**Klíčové funkce:**
- Implementuje throttling (5 sekund), aby se aktivity neodesílaly příliš často
- Poskytuje možnost dočasně pozastavit sledování
- Spravuje informace o aktuálním projektu
- Implementuje rozhraní `Disposable` pro správné uvolnění zdrojů
- Poskytuje přístup k času poslední aktivity pomocí getter metody `lastActivityTime`

### 2. ApiClient

Třída `ApiClient` zajišťuje komunikaci s centrálním serverem.

**Hlavní metody:**
- `sendHeartbeat(data)`: Odesílá heartbeat data na server
- `sendStats(data)`: Odesílá statistiky o změnách v kódu na server

**Implementační detaily:**
- Získává URL serveru z konfigurace rozšíření
- Odesílá data pomocí HTTP POST požadavku
- Ošetřuje chyby při komunikaci se serverem

### 3. GitStashManager

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

### 4. StatsReporter

Třída `StatsReporter` je zodpovědná za pravidelné odesílání statistik o změnách v kódu.

**Klíčové funkce:**
- Implementuje periodické odesílání statistik pomocí `setInterval`
- Sleduje události uložení souborů (`onDidSaveTextDocument`)
- Odesílá statistiky pouze když došlo k uložení souboru od posledního odeslání
- Kontroluje aktivitu uživatele před odesláním statistik
- Využívá `GitStashManager` pro získání aktuálních statistik
- Využívá `ApiClient` pro odeslání statistik na server
- Implementuje rozhraní `Disposable` pro správné uvolnění zdrojů

**Hlavní metody:**
- `start()`: Spustí pravidelné odesílání statistik
- `stop()`: Zastaví pravidelné odesílání statistik
- `reportStats()`: Získá a odešle statistiky, pokud je uživatel aktivní a došlo k uložení souboru

**Optimalizace:**
- Provádí náročnou operaci git diff pouze když je skutečně potřeba (po uložení souboru)
- Sleduje příznak `fileWasSaved`, který indikuje, zda došlo k uložení souboru od posledního odeslání statistik
- Šetří systémové zdroje vynecháním zbytečných git diff operací, když se kód nezměnil

### 5. SessionManager

Třída `SessionManager` je zodpovědná za správu sessions, včetně vytváření nových sessions při prvním spuštění nebo po dlouhé neaktivitě.

**Klíčové funkce:**
- Správa stavů relace (aktivní, neaktivní)
- Koordinace vytváření nových Git stash hashů
- Implementuje rozhraní `Disposable` pro správné uvolnění zdrojů

### 6. StatusBarController

Třída `StatusBarController` zobrazuje aktuální stav sledování ve status baru VS Code.

**Funkce:**
- Zobrazuje ikonu a text indikující stav sledování (aktivní/pozastaveno)
- Umožňuje přepínat stav sledování kliknutím na položku
- Dynamicky aktualizuje tooltip s popisem aktuálního stavu

## Hlavní funkcionalita

### Sledování aktivity

Rozšíření sleduje aktivitu uživatele registrováním posluchačů na různé VS Code události. Při detekci aktivity:
1. Aktualizuje čas poslední aktivity
2. Pokud uplynul dostatečný čas od posledního odeslání, odešle heartbeat na server
3. Loguje aktivitu do konzole pro snazší debugging

### Získávání informací o projektu

Informace o projektu jsou aktualizovány:
1. Při prvním spuštění rozšíření
2. Při změnách workspace folderů

### Pozastavení sledování

Uživatel může dočasně pozastavit sledování:
1. Kliknutím na položku ve status baru
2. Použitím příkazu "Toggl Auto Tracker: Toggle Pause" z příkazové palety

Při pozastavení:
1. Změní se ikona a text v status baru
2. Heartbeaty nejsou odesílány na server, i když je detekována aktivita
3. Stav pozastavení je zachován až do explicitní změny

### Sledování statistik o změnách v kódu

Rozšíření sbírá a odesílá statistiky o změnách v kódu efektivním způsobem:
1. Při inicializaci vytvoří referenční bod pomocí Git stash hashe
2. Nastaví pravidelný interval (každých 60 sekund) pro potenciální odeslání statistik
3. Sleduje události uložení souborů a nastavuje příznak při každém uložení
4. Statistiky skutečně získává a odesílá pouze když:
   - Uplynul nastavený interval
   - Uživatel je aktivní
   - Od posledního odeslání byl uložen alespoň jeden soubor
5. Statistiky zahrnují počet změněných souborů, přidaných a odebraných řádků
6. Server používá tyto statistiky k obohacení popisků time entries v Toggl

Tato optimalizovaná implementace zajišťuje:
- Minimální zatížení systému (git diff se provádí pouze když je potřeba)
- Přesné statistiky odrážející skutečné změny v kódu
- Spolehlivé poskytování dat serveru pro vytváření informativních popisků

## Konfigurace

Rozšíření lze konfigurovat přes nastavení VS Code:

```json
{
  "togglAutoTracker.serverUrl": "http://localhost:3000"
}
```

Tato hodnota určuje URL centrálního serveru, na který jsou odesílány heartbeaty a statistiky.

## Příkazy

Rozšíření registruje následující příkazy:

1. `toggl-auto-tracker.togglePause` ("Toggl Auto Tracker: Toggle Pause")
   - Přepíná mezi aktivním a pozastaveným stavem sledování
   - Aktualizuje UI pro indikaci nového stavu

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
