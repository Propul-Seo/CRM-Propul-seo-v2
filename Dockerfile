# syntax=docker/dockerfile:1.7

# ============================================================================
# Stage 1 — Build
# ============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Variables d'env Vite injectées à BUILD TIME par Coolify.
# Doivent être marquées "build variable" dans Coolify Environment Variables.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Install deps (cache layer si package*.json inchangés)
COPY package.json package-lock.json ./
RUN npm ci --include=dev --no-audit --no-fund

# Build
COPY . .
RUN npm run build

# ============================================================================
# Stage 2 — Serve
# ============================================================================
FROM nginx:1.27-alpine

# Copie config nginx custom (SPA fallback + gzip + cache)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie le build Vite
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck (Coolify utilise ça pour valider le déploiement)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
