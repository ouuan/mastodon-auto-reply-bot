FROM node:24.18.0-slim

WORKDIR /app

RUN npm i -g pnpm

COPY package.json pnpm-*.yaml ./
RUN pnpm i

COPY . .
RUN pnpm build

CMD ["node", "."]
