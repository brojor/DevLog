# Dokumentace Chrome rozšíření pro DevLog

## Přehled

Chrome rozšíření pro DevLog je součást monorepo projektu, která umožňuje automatické sledování času stráveného v prohlížeči. Rozšíření detekuje aktivitu uživatele a odesílá heartbeaty na centrální server, kde se údaje zpracovávají a ukládají do Notion.

## Adresářová struktura

```
packages/chrome-extension/
├── manifest.json          # Konfigurační soubor rozšíření
├── src/
│   ├── background.ts      # Background skript pro odesílání heartbeatů
│   └── content.ts         # Content script pro detekci aktivity uživatele
├── .env                   # Konfigurační proměnné pro vývoj
├── .env.example           # Šablona pro konfigurační proměnné
├── package.json           # Definice balíčku a závislostí
├── tsconfig.json          # Konfigurace TypeScript
└── vite.config.ts         # Konfigurace Vite pro build
```

## Princip fungování

Chrome rozšíření pracuje na následujícím principu:

1. **Detekce aktivity uživatele**:
   - Content script je vložen do každé navštívené stránky
   - Sleduje události jako pohyb myši, stisknutí kláves, scrollování
   - Při detekci aktivity odesílá zprávu do background scriptu

2. **Odesílání heartbeatů**:
   - Background script přijímá zprávy o aktivitě
   - Odesílá heartbeat na server
   - Heartbeaty jsou omezeny na jeden za 5 sekund

3. **Efektivní zpracování**:
   - Heartbeaty jsou odesílány pouze když je detekována aktivita
   - Veškerá logika zpracování času probíhá na serveru

## Komponenty

### 1. Content Script (content.ts)

Content script je vložen do každé webové stránky a detekuje interakce uživatele s prohlížečem.

**Sledované události**:
- Kliknutí myši (`mousedown`)
- Stisknutí kláves (`keydown`)
- Scrollování (`scroll`)
- Pohyb myši (`mousemove`)
- Změna fokusu (`focus`)

**Implementace**:
- Používá throttling pro omezení počtu zpráv (max 1 za 5 sekund)
- Odesílá zprávy s časovým razítkem aktivity do background scriptu
- Běží izolovaně v kontextu každé webové stránky

### 2. Background Script (background.ts)

Background script běží na pozadí rozšíření a zajišťuje komunikaci se serverem.

**Funkce**:
- Přijímá zprávy o aktivitě z content scriptu
- Odesílá heartbeaty na API server
- Zpracovává odpovědi ze serveru
- Loguje aktivitu do konzole pro snazší debugging

**Komunikace se serverem**:
- Heartbeaty jsou odesílány ve formátu:
  ```json
  {
    "timestamp": 1635513267123,
    "source": "chrome"
  }
  ```
- Endpoint: `/api/heartbeat`
- Metoda: POST
- Content-Type: application/json

### 3. Manifest (manifest.json)

Konfigurační soubor rozšíření, který definuje jeho chování v Chrome.

**Klíčové části**:
- Používá Manifest V3
- Definuje background service worker
- Specifikuje content skripty a jejich umístění
- Nastavuje potřebná hostitelská oprávnění

## Konfigurace

Konfigurace rozšíření je uložena v souboru `.env`:

```
# Konfigurace API URL
VITE_API_URL=http://localhost:3000
```

Tato hodnota je během buildu zpracována Vite a dostupná v kódu jako:
```javascript
import.meta.env.VITE_API_URL
```

## Build a nasazení

### Vývojové prostředí

```bash
# Instalace závislostí
cd packages/chrome-extension
pnpm install

# Spuštění vývojového buildu s hot-reload
pnpm dev
```

### Produkční build

```bash
# Vytvoření produkčního buildu
pnpm build
```

### Instalace rozšíření v Chrome

1. Otevřete Chrome a přejděte na `chrome://extensions/`
2. Zapněte "Developer mode" (pravý horní roh)
3. Klikněte na "Load unpacked" (levý horní roh)
4. Vyberte adresář `packages/chrome-extension/dist`

## Debugging

### Background Script

Pro zobrazení logů z background scriptu:
1. Otevřete `chrome://extensions/`
2. Najděte rozšíření "DevLog"
3. Klikněte na odkaz "service worker" v detailech rozšíření
4. Otevře se DevTools s konzolí pro background script

### Content Script

Pro zobrazení logů z content scriptu:
1. Otevřete DevTools na libovolné stránce (F12 nebo pravý klik -> Inspect)
2. Přejděte na záložku "Console"
3. Logy z content scriptu budou zobrazeny zde

## Bezpečnostní poznámky

- Rozšíření potřebuje přístup k `http://localhost:3000/*` pro komunikaci s lokálním vývojovým serverem
- V produkční verzi by měla být tato URL změněna na skutečný API endpoint
- Rozšíření nemá přístup k citlivým datům z webových stránek, pouze detekuje uživatelské interakce
