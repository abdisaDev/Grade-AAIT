# Use the official Puppeteer image
FROM ghcr.io/puppeteer/puppeteer:24.6.1

# Keep these environment variables as they are correct for this base image
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci

# Copy the rest of your application code
COPY . .

# Command to run your application
# Make sure 'dist/index.js' is the correct entry point for your compiled code
CMD [ "node", "dist/index.js" ]

# Expose the port your application listens on
EXPOSE 2423