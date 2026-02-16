# Use Node.js 22.12 as the base image
FROM node:22.12-slim

# Install openssl for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Create and set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml (if available)
COPY package.json pnpm-lock.yaml* ./

# Install dependencies (using npm since pnpm might not be in the base image)
# If you prefer pnpm, you can install it: RUN npm install -g pnpm
RUN npm install

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose the port the app runs on
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
