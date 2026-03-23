###################################################
# Stage: base
# 
# This base stage ensures all other stages are using the same base image
# and provides common configuration for all stages, such as the working dir.
###################################################
FROM node:24-alpine AS base
WORKDIR /usr/local/app








################## CONTESTS STAGES ##################

###################################################
# Stage: contests-base
#
# This stage is used as the base for the contests-dev and contests-build stages,
# since there are common steps needed for each.
###################################################
FROM base AS contests-base
COPY ./package.json ./package-lock.json ./
RUN npm install
COPY ./ ./

###################################################
# Stage: contests-dev
# 
# This stage is used for development of the contests application. It sets 
# the default command to start the Node.js development server.
###################################################
FROM contests-base AS contests-dev
CMD ["npm", "run", "dev"]