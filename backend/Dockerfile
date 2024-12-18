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
FROM node:21-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install production dependencies
RUN npm install --only=production && npm cache clean --force

# Copy the application source code
COPY . .

# Minify the code to remove comments (example using terser for JavaScript)
RUN npx terser -c -m -o apis.min.js -- apis.js

# Stage 2: Production Stage
FROM node:21-alpine

# Set the working directory
WORKDIR /app

# Copy the production dependencies from the build stage
COPY --from=build /app/node_modules /app/node_modules

# Copy the minified application code
COPY --from=build /app/apis.min.js /app/apis.js

# Copy package.json for reference
COPY --from=build /app/package.json /app/package.json

# Expose the application port
EXPOSE 5000

# Command to run the server
CMD ["node", "apis.js"]
