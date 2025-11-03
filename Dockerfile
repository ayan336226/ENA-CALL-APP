# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy rest of the app
COPY . .

# Expose port (same as your server.js)
EXPOSE 8080

# Start the server
CMD ["node", "server.js"]
