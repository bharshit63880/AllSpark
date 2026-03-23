###################################################
# Stage: base
# 
# This base stage ensures all other stages are using the same base image
# and provides common configuration for all stages, such as the working dir.
###################################################
FROM node:24-alpine AS base
WORKDIR /usr/local/app








################## SUBMISSIONS STAGES ##################

###################################################
# Stage: submissions-base
#
# This stage is used as the base for the submissions-dev and submissions-build stages,
# since there are common steps needed for each.
###################################################
FROM base AS submissions-base
COPY ./package.json ./package-lock.json ./
RUN npm install
COPY ./ ./

###################################################
# Stage: submissions-dev
# 
# This stage is used for development of the submissions application. It sets 
# the default command to start the Node.js development server.
###################################################
FROM submissions-base AS submissions-dev
CMD ["npm", "run", "dev"]