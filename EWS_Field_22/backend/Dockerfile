FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY web/package.json web/package.json
COPY mobile/package.json mobile/package.json
COPY scripts/patch-metro.mjs scripts/patch-metro.mjs
RUN npm ci --omit=dev --workspace=backend --include-workspace-root=false && mkdir /data && chown node:node /data
COPY backend ./backend
USER node
WORKDIR /app/backend
ENV MEDIA_DIR=/data/private-media
EXPOSE 4000
CMD ["node", "src/index.js"]
