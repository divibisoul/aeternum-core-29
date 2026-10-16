FROM node:22-bookworm-slim

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
# Use the checked-in npm lockfile deterministically; build/test dependencies
# remain excluded from the production image. Legacy peer handling is retained
# for the repository's existing peer graph without mutating package-lock.json.
RUN npm ci --omit=dev --legacy-peer-deps --no-audit --no-fund

COPY . .

ENV SOUL_MESH_N01_HOST=0.0.0.0
ENV SOUL_MESH_N01_PORT=8080
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.SOUL_MESH_N01_PORT || process.env.PORT || 8080) + '/mesh/health').then(async r => { if (!r.ok) process.exit(1); const b = await r.json(); process.exit(b.ok === true && b.nucleus === 'N01' ? 0 : 1); }).catch(() => process.exit(1));"]

CMD ["node", "scripts/soul-mesh-server-entry.mjs"]
