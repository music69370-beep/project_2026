
# Use a more complete Node.js image for better compatibility
FROM node:20-alpine


# Set the working directory
WORKDIR /app

# Copy package files first to leverage Docker caching
COPY package.json package-lock.json ./

ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

EXPOSE 4000

# Specify the default command
CMD ["npm", "start"]
