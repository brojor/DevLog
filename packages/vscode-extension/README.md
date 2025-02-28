# Toggl Auto Tracker - VS Code Rozšíření

## 🚀 Přehled

Toggl Auto Tracker je automatizované řešení pro sledování času ve VS Code, které pomáhá vývojářům přesně zaznamenávat čas strávený prací na projektech bez ručního zadávání.

## ✨ Funkce

- **Automatické sledování aktivity** v editoru
- **Detekce projektu** z konfiguračních souborů
- **Heartbeat mechanismus** pro přesné měření času
- **Minimální zásah do workflow vývojáře**
- **Pozastavení sledování** jedním kliknutím

## 🔧 Požadavky

- VS Code verze 1.60.0 nebo vyšší
- Node.js verze 20.10.0 nebo vyšší
- Běžící Toggl Auto Tracker server

## 📦 Instalace

### Ruční instalace

1. Stáhněte si VSIX soubor z releases
2. Ve VS Code: `Extensions` → `...` → `Install from VSIX`

## 🛠 Konfigurace

V nastavení VS Code můžete upravit:

```json
{
  "togglAutoTracker.serverUrl": "http://localhost:3000"
}
```

## 🎮 Ovládání

- **Status Bar**: Kliknutím pozastavíte/obnovíte sledování
- Příkaz: `Toggl Auto Tracker: Toggle Pause`

## 📋 Licence

Projekt je licencován pod MIT licencí. Úplné znění licence naleznete v souboru [LICENSE](https://github.com/brojor/toggl-auto-tracker/blob/main/packages/vscode-extension/LICENSE.md).

## 🔗 Další komponenty

- **[Centrální server](https://github.com/brojor/toggl-auto-tracker/tree/main/packages/server)**: Node.js backend
- **[Chrome rozšíření](https://github.com/brojor/toggl-auto-tracker/tree/main/packages/chrome-extension)**: Sledování času v prohlížeči

## 🐛 Hlášení problémů

Použijte GitHub Issues v hlavním repozitáři projektu.
