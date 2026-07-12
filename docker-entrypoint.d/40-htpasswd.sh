#!/bin/sh
# Generate the HTTP Basic Auth password file at container start from runtime
# secrets. The nginx base image runs every executable *.sh in this directory
# before launching nginx, so the file is in place before the first request.
#
# Fail fast if no password is configured: a prototype that is meant to be
# password-gated must never boot wide open by accident.
set -e

: "${BASIC_AUTH_USER:=preview}"

if [ -z "${BASIC_AUTH_PASSWORD:-}" ]; then
    echo "FATAL: BASIC_AUTH_PASSWORD is not set — refusing to start an unprotected app." >&2
    echo "       Set it locally (.env) or on Fly with: fly secrets set BASIC_AUTH_PASSWORD=..." >&2
    exit 1
fi

htpasswd -bc /etc/nginx/.htpasswd "$BASIC_AUTH_USER" "$BASIC_AUTH_PASSWORD"
echo "Basic Auth configured for user '$BASIC_AUTH_USER'."
