# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install OpenSSL for Prisma runtime and wget for healthcheck
RUN apk add --no-cache openssl wget

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Create startup script
RUN printf '#!/bin/sh\nset -e\necho "Running Prisma migrations..."\nnpx prisma migrate deploy || echo "Migration warning (continuing)"\necho "Starting API Gateway..."\nexec node dist/server.js\n' > /app/start.sh && chmod +x /app/start.sh

# Set proper permissions before switching user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /app

USER nodejs

ENV PORT=4000
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["/app/start.sh"]
