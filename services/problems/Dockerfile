###################################################
# Stage: base
# 
# This base stage ensures all other stages are using the same base image
# and provides common configuration for all stages, such as the working dir.
###################################################
FROM node:24-alpine AS base
WORKDIR /usr/local/app








################## PROBLEMS STAGES ##################

###################################################
# Stage: problems-base
#
# This stage is used as the base for the problems-dev and problems-build stages,
# since there are common steps needed for each.
###################################################
FROM base AS problems-base
COPY ./package.json ./package-lock.json ./
RUN npm install
COPY ./ ./

###################################################
# Stage: problems-dev
# 
# This stage is used for development of the problems application. It sets 
# the default command to start the Node.js development server.
###################################################
FROM problems-base AS problems-dev
CMD ["npm", "run", "dev"]