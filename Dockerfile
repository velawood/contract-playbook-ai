FROM node:20-alpine AS builder

WORKDIR /app

# Install deps
COPY package.json package-lock.json ./
RUN npm ci

# Build
COPY . .
RUN npm run build

# Runtime image: nginx serving static assets
FROM nginx:1.27-alpine

# Replace default server config with SPA-friendly one
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
