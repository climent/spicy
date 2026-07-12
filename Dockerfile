# Stage 1: Build the React application
FROM node:26-slim AS build
WORKDIR /app

# Install build dependencies for native modules if needed
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package.json to install dependencies cleanly
COPY package.json ./

# Install dependencies (since we are on slim, npm install will download matching native bindings)
RUN npm install

# Copy the rest of the source files and build the app
COPY . .
RUN npm run build

# Stage 2: Serve the static files with Nginx behind HTTP Basic Auth
FROM nginx:stable-alpine

# apache2-utils provides `htpasswd`, used by the entrypoint to build the
# password file from runtime secrets.
RUN apk add --no-cache apache2-utils

# Copy built static assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# SPA config with a ${PORT} placeholder. The nginx image renders templates in
# /etc/nginx/templates/ via envsubst into /etc/nginx/conf.d/ at startup, which
# overrides the image's default.conf.
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

# Generates /etc/nginx/.htpasswd from BASIC_AUTH_USER / BASIC_AUTH_PASSWORD
# before nginx launches (and fails fast if the password is missing).
COPY docker-entrypoint.d/40-htpasswd.sh /docker-entrypoint.d/40-htpasswd.sh
RUN chmod +x /docker-entrypoint.d/40-htpasswd.sh

# Port nginx listens on; matches Fly's internal_port. Override via env if needed.
ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
