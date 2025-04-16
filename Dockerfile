FROM node:23-slim AS base
WORKDIR /app
COPY package*.json /app/

FROM base AS prod-deps
RUN npm ci --omit=dev

FROM base AS prod-build
RUN npm ci
COPY . /app/
RUN npm run build

FROM base AS api
COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=prod-build /app/dist /app/dist
CMD  [ "node", "dist/src/index.js" ]
