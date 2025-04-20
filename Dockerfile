# Use the official Puppeteer image
FROM ghcr.io/puppeteer/puppeteer:24.6.1

# Keep this environment variable
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# REMOVE the PUPPETEER_EXECUTABLE_PATH line

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install Node.js dependencies (this includes puppeteer itself)
RUN npm ci

# Copy the rest of your application code
COPY . .

# Command to run your application
CMD [ "node", "dist/index.js" ]

# Expose the port your application listens on
EXPOSE 2423