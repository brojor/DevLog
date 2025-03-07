#!/bin/bash
# Deployment skript pro DevLog server

# Konfigurace
SERVER_HOST="n40l"  # Použití SSH aliasu z ~/.ssh/config
SERVER_PATH="/home/brojor/production/devlog"  # Cesta na serveru
TEMP_DIR="/tmp/devlog-deploy"  # Dočasný adresář pro tarbally

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
pnpm -r --filter="@devlog/server" build
pnpm -r --filter="@devlog/shared" build

# 2. Zabalení shared balíčku
echo_step "Zabalení shared balíčku..."
cd ../shared
pnpm pack --pack-destination $TEMP_DIR
SHARED_PACKAGE=$(ls -1 $TEMP_DIR/*.tgz | xargs basename)
cd ../server

# 3. Úprava package.json pro produkční nasazení
echo_step "Úprava package.json pro produkční nasazení..."
jq --arg shared_pkg "file:./$SHARED_PACKAGE" '.dependencies."@devlog/shared" = $shared_pkg' package.json > $TEMP_DIR/package.json

# 4. Příprava a kopírování souborů na server
echo_step "Příprava a kopírování souborů na server..."
# Vytvoření adresářové struktury na serveru
ssh $SERVER_HOST "mkdir -p $SERVER_PATH/dist $SERVER_PATH/logs"

# Synchronizace souborů v jednom kroku
rsync -rtvz --delete dist/ $SERVER_HOST:$SERVER_PATH/dist/
rsync -rtvz $TEMP_DIR/package.json ecosystem.config.cjs $TEMP_DIR/*.tgz .env $SERVER_HOST:$SERVER_PATH/

# 5. Instalace závislostí a restart aplikace
echo_step "Instalace závislostí a restart aplikace..."
ssh $SERVER_HOST "cd $SERVER_PATH && pnpm install --prod && pm2 start ecosystem.config.cjs --update-env"

# 6. Úklid
echo_step "Úklid dočasných souborů..."
rm -rf $TEMP_DIR

echo_success "Deployment dokončen!"