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

RUN mkdir /app
WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --pure-lockfile --no-progress && if [ $? -eq 0 ]; then echo "INSTALL OK"; else echo "INSTALL FAILED"; exit 1; fi;

ADD . .
RUN yarn install
RUN yarn run build

RUN test -f ./lib/serve.js

RUN node ./lib/test.js

EXPOSE 8080
CMD [ "yarn", "run", "start" ]