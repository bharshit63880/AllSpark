###################################################
# Stage: base
# 
# This base stage ensures all other stages are using the same base image
# and provides common configuration for all stages, such as the working dir.
###################################################
FROM node:24-alpine AS base
WORKDIR /usr/local/app








################## API STAGES ##################

###################################################
# Stage: api-base
#
# This stage is used as the base for the api-dev and api-build stages,
# since there are common steps needed for each.
###################################################
FROM base AS api-base
COPY ./package.json ./package-lock.json ./
RUN npm install
COPY ./ ./


###################################################
# Stage: api-dev
# 
# This stage is used for development of the api application. It sets 
# the default command to start the Node.js development server.
###################################################
FROM api-base AS api-dev
CMD ["npm", "run", "dev"]