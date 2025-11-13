FROM node:20-alpine AS builder

WORKDIR /app

# Install build tools used by some native modules and Prisma
RUN apk add --no-cache python3 make g++ bash

# Install dependencies (skip lifecycle scripts that expect pnpm)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --ignore-scripts

# Copy source and Prisma schema early for caching
COPY prisma ./prisma
COPY tsconfig.json tsconfig.build.json ./
COPY . .

# Generate Prisma client and build the app
RUN npx prisma generate
RUN yarn build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache bash

# Install production dependencies only (skip lifecycle scripts)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production --ignore-scripts

# Copy built app and Prisma client files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "dist/main"]
