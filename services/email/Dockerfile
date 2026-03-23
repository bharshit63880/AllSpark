###################################################
# Stage: base
# 
# This base stage ensures all other stages are using the same base image
# and provides common configuration for all stages, such as the working dir.
###################################################
FROM node:24-alpine AS base
WORKDIR /usr/local/app




################## EMAIL STAGES ##################

###################################################
# Stage: email-base
#
# This stage is used as the base for the email-dev and email-build stages,
# since there are common steps needed for each.
###################################################
FROM base AS email-base
COPY ./package.json ./package-lock.json ./
RUN npm install
COPY ./ ./

###################################################
# Stage: email-dev
# 
# This stage is used for development of the email application. It sets 
# the default command to start the Node.js development server.
###################################################
FROM email-base AS email-dev
CMD ["npm", "run", "dev"]
