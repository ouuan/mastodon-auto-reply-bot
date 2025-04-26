FROM node:22.15.0-slim

WORKDIR /app

RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm i

COPY . .
RUN pnpm build

CMD ["node", "."]
