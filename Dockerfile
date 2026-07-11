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

# Stage 2: Serve the static files with Nginx
FROM nginx:stable-alpine

# Copy built static assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Overwrite default Nginx config to support client-side routing (SPA history fallback)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]