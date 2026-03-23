FROM node:24-alpine AS base
WORKDIR /usr/local/app

FROM base AS special-access-base
COPY ./package*.json ./
RUN npm install
COPY ./ ./

FROM special-access-base AS special-access-dev
CMD ["npm", "run", "dev"]
