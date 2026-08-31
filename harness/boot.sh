#!/usr/bin/env bash
# Boots WordPress Playground with a plugin mounted + activated and waits until
# wp-admin answers. Fails FAST (dumping the server log) if the Playground
# process dies during boot — which is exactly what a plugin PHP parse error or
# activation fatal does: --auto-mount's activate step exits 255 and the server
# never binds the port. Without this the caller just waits out the full timeout
# and reports a misleading "did not boot in time".
set -euo pipefail

PLUGIN_DIR="${1:?usage: boot.sh <plugin-dir> [log-path]}"
LOG="${2:-/tmp/playground.log}"
PORT="${PLAYGROUND_PORT:-9400}"
PHP="${PLAYGROUND_PHP:-8.3}"
WP="${PLAYGROUND_WP:-latest}"
BLUEPRINT="${PLAYGROUND_BLUEPRINT:-}"

args=( server
  --auto-mount="$PLUGIN_DIR"
  --port="$PORT"
  --php="$PHP"
  --wp="$WP"
  --login
  --define-bool WP_DEBUG true
  --verbosity=normal )
if [ -n "$BLUEPRINT" ]; then
  args+=( --blueprint="$BLUEPRINT" --blueprint-may-read-adjacent-files )
fi

nohup npx @wp-playground/cli "${args[@]}" > "$LOG" 2>&1 &
PGPID=$!
echo "Waiting for WordPress to boot (pid $PGPID)..."
for i in $(seq 1 90); do
  if ! kill -0 "$PGPID" 2>/dev/null; then
    echo "::error::WordPress Playground exited during boot — the plugin likely has a PHP parse error or an activation fatal."
    cat "$LOG" || true
    exit 1
  fi
  if curl -sf -o /dev/null "http://127.0.0.1:$PORT/wp-login.php"; then
    echo "WordPress is up after ~$((i * 2))s."
    exit 0
  fi
  sleep 2
done
echo "::error::WordPress Playground did not boot in time."
cat "$LOG" || true
exit 1
