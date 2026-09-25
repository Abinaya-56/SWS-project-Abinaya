#!/bin/sh
set -eu

envsubst '${VITE_API_URL}' < /etc/nginx/config.js.template > /usr/share/nginx/html/config.js
exec /docker-entrypoint.sh "$@"
