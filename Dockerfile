ARG NODE_VERSION=22.0.0
ARG APP_DIR=/app
ARG BUILD_DIR=/build

FROM node:${NODE_VERSION}-alpine AS build
ARG BUILD_DIR

WORKDIR ${BUILD_DIR}
COPY ./ ./
RUN rm -rf ./node_modules
RUN npm install -g pnpm
RUN pnpm i
RUN pnpm build
RUN pnpm i -P

FROM node:${NODE_VERSION}-alpine AS final

ARG APP_DIR
ARG BUILD_DIR

RUN mkdir -p ${APP_DIR}
WORKDIR ${APP_DIR}
COPY --from=build ${BUILD_DIR}/build ./
COPY --from=build ${BUILD_DIR}/package.json ./package.json

ENV PORT=8080
EXPOSE ${PORT}/tcp ${PORT}/udp
ENTRYPOINT [ "node", "." ]