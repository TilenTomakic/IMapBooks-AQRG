FROM node:8-alpine

RUN set -ex; \
    apk add --no-cache \
    build-base \
    gcc \
    wget \
    git \
    openssh \
    tar \
    python

WORKDIR /server

COPY . /server
RUN yarn install

RUN yarn run build

EXPOSE 8080
CMD [ "yarn", "run", "start" ]