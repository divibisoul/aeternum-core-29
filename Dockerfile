FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY . .

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "const port = Number(process.env.SOUL_MESH_N01_PORT || process.env.PORT || 8080); fetch('http://127.0.0.1:' + port + '/mesh/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1));"]

CMD ["node", "scripts/soul-mesh-server-entry.mjs"]
