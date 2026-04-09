FROM node:20-alpine

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# For monorepos, copying everything early avoids broken module links
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps ./apps
COPY packages ./packages

# Install all dependencies and build the server package
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @qworship/server build

# Set production context
ENV NODE_ENV=production

EXPOSE 5000

# Start compiled dist app
CMD ["node", "apps/server/dist/index.js"]
