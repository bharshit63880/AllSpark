FROM node:24-alpine AS base
WORKDIR /usr/local/app

FROM base AS leaderboard-base
COPY ./package.json ./package-lock.json ./
RUN npm install
COPY ./ ./

FROM leaderboard-base AS leaderboard-dev
CMD ["npm", "run", "dev"]
