# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Copy root configs
COPY package.json yarn.lock ./

# Copy workspace configs
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install dependencies for all workspaces
RUN --mount=type=cache,target=/usr/local/share/.cache/yarn/v6,sharing=locked yarn install --frozen-lockfile

# Copy all source code
COPY . .

# Build backend
RUN yarn workspace b8s-backend run build

# Final stage
FROM node:22-slim

WORKDIR /app

COPY package.json yarn.lock ./

COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN --mount=type=cache,target=/usr/local/share/.cache/yarn/v6,sharing=locked yarn install --frozen-lockfile --production --ignore-scripts --prefer-offline

COPY --from=builder /app/backend/dist ./backend/dist

ENV PORT=3000
ENV NODE_ENV=production

EXPOSE 3000

# Set working directory to the backend workspace
WORKDIR /app/backend

CMD ["node", "dist/index.js"]
