###################################################
# Stage: base
# 
# This base stage ensures all other stages are using the same base image
# and provides common configuration for all stages, such as the working dir.
###################################################
FROM node:24-alpine AS base
WORKDIR /usr/local/app








################## USERS STAGES ##################

###################################################
# Stage: users-base
#
# This stage is used as the base for the users-dev and users-build stages,
# since there are common steps needed for each.
###################################################
FROM base AS users-base
COPY ./package.json ./package-lock.json ./
RUN npm install
COPY ./ ./

###################################################
# Stage: users-dev
# 
# This stage is used for development of the users application. It sets 
# the default command to start the Node.js development server.
###################################################
FROM users-base AS users-dev
CMD ["npm", "run", "dev"]