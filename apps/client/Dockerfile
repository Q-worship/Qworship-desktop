FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy basic monorepo files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps ./apps
COPY packages ./packages

# Install dependencies based on lockfile
RUN pnpm install --frozen-lockfile

# These ARGs allow the Vite build step to inject environment variables properly
ARG VITE_API_URL
ARG VITE_WS_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL

# Build client
RUN pnpm --filter @qworship/client build

FROM nginx:alpine

# Custom Nginx configuration for single page apps (SPA routing)
RUN echo $'server {\n\
    listen 80;\n\
    location / {\n\
        root   /usr/share/nginx/html;\n\
        index  index.html index.htm;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
}' > /etc/nginx/conf.d/default.conf

# Copy compiled artifacts from builder
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
