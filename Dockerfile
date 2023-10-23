FROM node:18-bookworm-slim
RUN apt-get update && apt-get install -y curl
WORKDIR /usr/src/app
RUN curl -sSL https://rover.apollo.dev/nix/latest | sh
COPY ./package.json .
COPY ./yarn.lock .
RUN yarn --frozen-lockfile
COPY . .
RUN yarn build