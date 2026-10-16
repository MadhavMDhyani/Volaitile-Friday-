FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source code with node user permissions
COPY --chown=node:node . .

USER node

EXPOSE 3000

# Health check using Node 20's built-in global fetch against /health/ping
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health/ping').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.js"]
