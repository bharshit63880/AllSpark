###################################################
# Stage: base
# 
# This base stage ensures all other stages are using the same base image
# and provides common configuration for all stages, such as the working dir.
###################################################
FROM node:24-alpine AS base
WORKDIR /usr/local/app








################## PERMISSIONS STAGES ##################

###################################################
# Stage: permissions-base
#
# This stage is used as the base for the permissions-dev and permissions-build stages,
# since there are common steps needed for each.
###################################################
FROM base AS permissions-base
COPY ./package.json ./package-lock.json ./
RUN npm install
COPY ./ ./

###################################################
# Stage: permissions-dev
# 
# This stage is used for development of the permissions application. It sets 
# the default command to start the Node.js development server.
###################################################
FROM permissions-base AS permissions-dev
CMD ["node", "startup.js"]