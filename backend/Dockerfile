# # Use Node.js version 21
# FROM node:21

# # Set the working directory inside the container
# WORKDIR /app

# # Copy package.json and package-lock.json
# COPY package.json package-lock.json ./

# # Install dependencies
# RUN npm install

# # Copy the rest of the application code
# COPY . .

# # Expose port 5000
# EXPOSE 5000

# # Command to start the server
# CMD ["node", "apis.js"]

# # Stage 1: Build Stage
# FROM node:21-alpine AS build

# # Set the working directory
# WORKDIR /app

# # Install dependencies
# COPY package.json package-lock.json ./
# RUN npm install --only=production && npm cache clean --force

# # Copy the application source code
# COPY . .

# # Minify the code (if needed)
# RUN npx terser -c -m -o apis.min.js -- apis.js

# # Stage 2: Production Stage
# FROM node:21-alpine

# # Set the working directory
# WORKDIR /app

# # Copy only necessary files from the build stage
# COPY --from=build /app/package.json /app/package.json
# COPY --from=build /app/apis.min.js /app/apis.js
# COPY --from=build /app/router.js /app/router.js
# COPY --from=build /app/controller.js /app/controller.js
# COPY --from=build /app/firebaseAdmin.js /app/firebaseAdmin.js
# COPY --from=build /app/node_modules /app/node_modules

# # Expose the application port
# EXPOSE 5000

# # Command to run the server
# CMD ["node", "apis.js"]






# # Stage 1: Build Stage
# FROM node:21-alpine AS build

# # Set the working directory
# WORKDIR /app

# # Copy only the package files first for efficient caching
# COPY package*.json ./

# # Install production dependencies
# RUN npm install --only=production && npm cache clean --force

# # Now copy the entire source code
# COPY . .

# # Optionally, run any build or minification steps
# # Example: minify apis.js -> apis.min.js
# RUN npx terser -c -m -o apis.min.js -- apis.js

# # Rename or move the minified file if that's what your code expects
# RUN mv apis.min.js apis.js


# # Stage 2: Production Stage
# FROM node:21-alpine

# # Set the working directory
# WORKDIR /app

# # Copy only necessary files from the build stage (includes all source files)
# COPY --from=build /app /app

# # Expose the application port
# EXPOSE 5000

# # Run the server
# CMD ["node", "apis.js"]

# Stage 1: Build Stage
FROM node:21-alpine AS build

# Set the working directory
WORKDIR /app

# Copy only the package files first for efficient caching
COPY package*.json ./

# Install production dependencies
RUN npm install --only=production && npm cache clean --force

# Now copy the entire source code
COPY . .

# Optionally, run any build or minification steps
# Example: minify apis.js -> apis.min.js
RUN npx terser -c -m -o apis.min.js -- apis.js

# Rename or move the minified file if that's what your code expects
RUN mv apis.min.js apis.js


# Stage 2: Production Stage
FROM node:21-alpine

# Set the working directory
WORKDIR /app

# Copy only necessary files from the build stage (includes all source files)
COPY --from=build /app /app

# Copy SSL certificate files into the container
# Make sure the `certs` directory exists in your project
COPY certs /app/certs

# Expose the application ports
EXPOSE 80
EXPOSE 443

# Run the server
CMD ["node", "apis.js"]
