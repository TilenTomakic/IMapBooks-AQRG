FROM node:8

WORKDIR /server

COPY . /server
RUN yarn install

EXPOSE 8080
CMD [ "yarn", "start" ]