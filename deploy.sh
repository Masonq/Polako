#!/usr/bin/env bash
# POLAKO deploy: installs docker if needed, creates .env once, builds, checks health, pushes the log to git.
set -uo pipefail
cd "$(dirname "$0")"
mkdir -p logs
LOG=logs/deploy.log
: > "$LOG"
log() { echo "[$(date -u +%FT%TZ)] $*" | tee -a "$LOG"; }

if ! command -v docker >/dev/null 2>&1; then
  log "installing docker"
  apt-get update -qq >>"$LOG" 2>&1 && apt-get install -y -qq docker.io docker-compose-v2 >>"$LOG" 2>&1
fi
if ! docker compose version >/dev/null 2>&1; then
  log "installing docker compose plugin"
  apt-get install -y -qq docker-compose-v2 >>"$LOG" 2>&1 || apt-get install -y -qq docker-compose-plugin >>"$LOG" 2>&1
fi
systemctl enable --now docker >>"$LOG" 2>&1 || true

if [ ! -f .env ]; then
  rnd() { tr -dc 'A-Za-z0-9' </dev/urandom | head -c "$1"; }
  PORT=8095
  while ss -ltn | awk '{print $4}' | grep -qE "[:.]${PORT}\$"; do PORT=$((PORT+1)); done
  {
    echo "PORT=$PORT"
    echo "POSTGRES_PASSWORD=$(rnd 24)"
    echo "SECRET_KEY=$(rnd 48)"
    echo "ADMIN_PASSWORD=$(rnd 12)"
    echo "TG_BOT_TOKEN="
    echo "TG_CHAT_ID="
  } > .env
  chmod 600 .env
  log ".env created (port $PORT)"
fi
set -a; . ./.env; set +a
export BUILD_ID="$(git rev-parse --short HEAD)-$(date +%s)"

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then ufw allow "${PORT}/tcp" >>"$LOG" 2>&1; fi

log "build $BUILD_ID"
docker compose up -d --build >>"$LOG" 2>&1
STATUS=fail
for i in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:${PORT}/health" 2>/dev/null | grep -q "$BUILD_ID"; then STATUS=ok; break; fi
  sleep 2
done
log "health: $STATUS"
if [ "$STATUS" != ok ]; then docker compose logs --tail 80 app >>"$LOG" 2>&1; fi
docker compose ps >>"$LOG" 2>&1
curl -s -o /dev/null -w "home %{http_code}\n" "http://127.0.0.1:${PORT}/" >>"$LOG" 2>&1
curl -s -o /dev/null -w "catalog %{http_code}\n" "http://127.0.0.1:${PORT}/api/catalog" >>"$LOG" 2>&1
curl -s -o /dev/null -w "og %{http_code}\n" "http://127.0.0.1:${PORT}/og/polako-stici-cemo.png" >>"$LOG" 2>&1
docker image prune -f >/dev/null 2>&1 || true

git config user.name "polako-server" ; git config user.email "server@polako.local"
git add logs/deploy.log && git commit -qm "deploy log $BUILD_ID" && (git pull -q --rebase && git push -q) >/dev/null 2>&1 || true

echo
echo "==============================================="
if [ "$STATUS" = ok ]; then echo " POLAKO работает: http://89.208.113.147:${PORT}"; else echo " ОШИБКА деплоя — лог отправлен в git (logs/deploy.log)"; fi
echo " Админка: http://89.208.113.147:${PORT}/admin"
echo " Пароль админки: ${ADMIN_PASSWORD}"
echo "==============================================="
