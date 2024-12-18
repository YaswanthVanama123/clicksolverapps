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

# Stage 1: Build Stage
FROM node:21-slim AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install --only=production && npm cache clean --force

# Copy the rest of the application code
COPY . .

# Stage 2: Production Stage
FROM node:21-slim

# Set the working directory
WORKDIR /app

# Copy the built files and dependencies from the build stage
COPY --from=build /app /app

# Expose port 5000
EXPOSE 5000

# Command to start the server
CMD ["node", "apis.js"]

