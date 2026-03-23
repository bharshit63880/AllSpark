###################################################
# Stage: base
###################################################
FROM node:24-alpine AS base
WORKDIR /usr/local/app

################## UI STAGES ##################

###################################################
# Stage: ui-base
###################################################
FROM base AS ui-base
COPY package*.json ./
RUN npm install
COPY . .

###################################################
# Stage: ui-dev
###################################################
FROM ui-base AS ui-dev

# Important for Docker + Windows stability
ENV CHOKIDAR_USEPOLLING=true

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]