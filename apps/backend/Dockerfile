# ====== Builder Stage ======
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY apps/backend/package*.json ./
COPY pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm@8

# Install all dependencies (including dev for build)
RUN pnpm install --no-frozen-lockfile

# Copy backend source code and Prisma schema
COPY apps/backend/*.config.* ./
COPY apps/backend/*.js ./
COPY apps/backend/*.json ./
COPY apps/backend/*.ts ./
COPY apps/backend/prisma ./prisma
COPY apps/backend/src ./src

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript app
RUN pnpm run build

# ====== Production Stage ======
FROM node:22-alpine AS production

WORKDIR /app

# Copy only production package files
COPY apps/backend/package*.json ./
COPY pnpm-lock.yaml ./

# Install only production dependencies
RUN npm install -g pnpm@8
RUN pnpm install --prod --no-frozen-lockfile

# Copy built app and Prisma client from builder
COPY --from=builder /app/prisma ./prisma
# Install Prisma client dependencies with workspace root flag
RUN pnpm add @prisma/client

# Generate Prisma client
RUN npx prisma generate

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
# Optional: non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
# Ensure application directory is writable by the non-root user
RUN chown -R nestjs:nodejs /app/prisma
USER nestjs

# Expose port and start app
EXPOSE 3000

CMD ["node", "dist/main"]
