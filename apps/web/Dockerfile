# apps/web/Dockerfile

# Stage 1: Build the Next.js application
FROM node:24-alpine AS builder
# Set the working directory to the monorepo root
WORKDIR /app

# Copy all package.json files to leverage Docker cache
COPY package.json ./
COPY apps/web/package.json ./apps/web/

# Install all dependencies for the entire monorepo
RUN npm install

# Copy the source code for the web app
COPY apps/web ./apps/web

# Change context to the web app's directory and build
WORKDIR /app/apps/web
RUN npm run build

# Stage 2: Create the production image
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV production

# Copy only necessary files from the builder stage
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/package.json ./package.json

# Install only production dependencies
RUN npm install --omit=dev

EXPOSE 3000
CMD ["npm", "start"]