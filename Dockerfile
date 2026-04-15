# WeatherNext v3 — Multi-layer cache optimization for CI/CD
# Designed for frequent builds with dependency caching

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Stage 1: Dependencies (rarely changes, heavily cached)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FROM node:20-alpine AS dependencies
WORKDIR /app

# Copy only package files (enables cache layer for npm ci)
COPY package*.json ./

# Install with offline/cache optimization
RUN npm ci --prefer-offline --no-audit --legacy-peer-deps

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Stage 2: Builder (source code changes trigger rebuild)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FROM node:20-alpine AS builder
WORKDIR /app

# Copy cached dependencies from stage 1
COPY --from=dependencies /app/node_modules ./node_modules

# Copy entire source tree
COPY . .

# Build arguments
ARG NEXT_PUBLIC_MAPBOX_TOKEN
ARG NEXT_PUBLIC_APP_NAME="WeatherNext Dashboard"
ARG BUILD_VERSION=unknown
ARG BUILD_DATE=unknown
ARG GIT_COMMIT=unknown
ARG BUILD_ENVIRONMENT=production

# Set build environment variables
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV BUILD_VERSION=$BUILD_VERSION
ENV BUILD_DATE=$BUILD_DATE
ENV GIT_COMMIT=$GIT_COMMIT
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js application (output in .next)
RUN npm run build

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Stage 3: Runtime (minimal production image)
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FROM node:20-alpine AS runtime
WORKDIR /app

# Production environment
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Copy pre-built standalone app from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Create directories
RUN mkdir -p ./public ./logs

# Copy version info for debugging
ARG BUILD_VERSION=unknown
ARG BUILD_DATE=unknown
ARG GIT_COMMIT=unknown
RUN echo "{\"version\": \"${BUILD_VERSION}\", \"date\": \"${BUILD_DATE}\", \"commit\": \"${GIT_COMMIT}\"}" > /app/.build-info.json

# Health check (critical for orchestration)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Image metadata (OCI standard labels)
LABEL org.opencontainers.image.title="WeatherNext Dashboard v3"
LABEL org.opencontainers.image.description="WeatherNext 2.0 probabilistic ensemble (64 members, 15-day forecast) — NCM UAE operational system"
LABEL org.opencontainers.image.version=$BUILD_VERSION
LABEL org.opencontainers.image.created=$BUILD_DATE
LABEL org.opencontainers.image.revision=$GIT_COMMIT
LABEL org.opencontainers.image.vendor="DiracDelta / Google DeepMind"
LABEL org.opencontainers.image.url="https://weathernext.ncm.ae"
LABEL com.ncm.system="WeatherNext 2.0 Decision Intelligence"
LABEL com.ncm.region="UAE"
LABEL com.ncm.features="15-day-forecast,64-member-ensemble,confidence-metrics,tail-risk-analysis,gemini-3.1-pro,uae-alert-scan"

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
USER nextjs

# Expose HTTP port
EXPOSE 8080

# Start Node.js server
CMD ["node", "server.js"]
