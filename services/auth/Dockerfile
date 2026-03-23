###################################################
# Stage: base
# 
# This base stage ensures all other stages are using the same base image
# and provides common configuration for all stages, such as the working dir.
###################################################
FROM node:24-alpine AS base
WORKDIR /usr/local/app








################## AUTH STAGES ##################

###################################################
# Stage: auth-base
#
# This stage is used as the base for the auth-dev and auth-build stages,
# since there are common steps needed for each.
###################################################
FROM base AS auth-base
COPY ./package.json ./package-lock.json ./
RUN npm install
COPY ./ ./

###################################################
# Stage: auth-dev
# 
# This stage is used for development of the auth application. It sets 
# the default command to start the Node.js development server.
###################################################
FROM auth-base AS auth-dev
CMD ["npm", "run", "dev"]