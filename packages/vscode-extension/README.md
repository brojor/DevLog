# DevLog - VS Code Rozšíření

## 🚀 Přehled

DevLog je automatizované řešení pro sledování času ve VS Code, které pomáhá vývojářům přesně zaznamenávat čas strávený prací na projektech bez ručního zadávání.

## ✨ Funkce

- **Automatické sledování aktivity** v editoru
- **Detekce projektu** z konfiguračních souborů
- **Heartbeat mechanismus** pro přesné měření času
- **Statistiky o změnách v kódu** (změněné soubory, přidané/odebrané řádky)
- **Git integrace** pro sledování změn bez narušení pracovního adresáře
- **Minimální zásah do workflow vývojáře**
- **Pozastavení sledování** jedním kliknutím

## 🔧 Požadavky

- VS Code verze 1.60.0 nebo vyšší
- Node.js verze 20.10.0 nebo vyšší
- Běžící DevLog server
- Git nainstalovaný a dostupný v PATH

## 📦 Instalace

### Ruční instalace

1. Stáhněte si VSIX soubor z releases
2. Ve VS Code: `Extensions` → `...` → `Install from VSIX`

## 🛠 Konfigurace

V nastavení VS Code můžete upravit:

```json
{
  "devlog.serverUrl": "http://localhost:3000"
}
```

## 📊 Sledování statistik

Rozšíření automaticky sleduje vaši aktivitu a sbírá tyto statistiky:
- Počet změněných souborů
- Počet přidaných řádků kódu
- Počet odebraných řádků kódu

Statistiky jsou periodicky odesílány na server, který je zahrnuje do popisků time logs v Notion.

## 🔗 Další komponenty

- **[Centrální server](https://github.com/brojor/devlog/tree/main/packages/server)**: Node.js backend
- **[Chrome rozšíření](https://github.com/brojor/devlog/tree/main/packages/chrome-extension)**: Sledování času v prohlížeči

## 🐛 Hlášení problémů

Použijte GitHub Issues v hlavním repozitáři projektu.
