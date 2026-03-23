FROM node:24-alpine AS base
WORKDIR /usr/local/app

FROM base AS support-ticket-base
COPY ./package*.json ./
RUN npm install
COPY ./ ./

FROM support-ticket-base AS support-ticket-dev
CMD ["npm", "run", "dev"]
