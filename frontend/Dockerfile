# ──────────────────────────────────────────────────────────────────────────────
# Stage 1 — Builder: Node.js to compile the React/Vite app
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first → cache npm install layer
COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# Copy full source
COPY . .

# Build production bundle (outputs to /app/dist)
RUN npm run build

# ──────────────────────────────────────────────────────────────────────────────
# Stage 2 — Runtime: Nginx to serve the static bundle
# ──────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/edumentor.conf

# Copy compiled React app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Nginx runs as PID 1 in foreground
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
