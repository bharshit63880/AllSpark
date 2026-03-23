###################################################
# Stage: base
# 
# This base stage ensures all other stages are using the same base image
# and provides common configuration for all stages, such as the working dir.
###################################################
FROM node:24-alpine AS base
WORKDIR /usr/local/app








################## JUDGE STAGES ##################

###################################################
# Stage: judge-base
#
# This stage is used as the base for the judge-dev and judge-build stages,
# since there are common steps needed for each.
###################################################
FROM base AS judge-base
COPY ./package.json ./package-lock.json ./
RUN npm install
COPY ./ ./

###################################################
# Stage: judge-dev
# 
# This stage is used for development of the judge application. It sets 
# the default command to start the Node.js development server.
###################################################
FROM judge-base AS judge-dev
CMD ["npm", "run", "dev"]