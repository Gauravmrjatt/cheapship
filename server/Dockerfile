# Use Node.js 22.12
FROM node:22.12-slim

# Install necessary system deps
RUN apt-get update -y && apt-get install -y openssl

# Create app dir
WORKDIR /app

# Copy dependency manifests
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN npm install

# Copy app code
COPY . .

# Expose port
EXPOSE 3001

# Generate Prisma client at build time
RUN npx prisma generate

# Run migrations & start app
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma generate && npm start"]