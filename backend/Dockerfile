# Use Node.js version 21
FROM node:21

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose port 5000
EXPOSE 5000

# Command to start the server
CMD ["node", "apis.js"]
