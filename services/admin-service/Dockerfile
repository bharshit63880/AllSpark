FROM node:24-alpine AS base
WORKDIR /usr/local/app

FROM base AS admin-base
COPY ./package.json ./package-lock.json* ./
RUN npm install
COPY ./ ./

FROM admin-base AS admin-dev
CMD ["npm", "run", "dev"]

FROM admin-base AS admin-prod
CMD ["npm", "start"]
