# Use Node.js 22
FROM node:22.12-slim

# Install dependencies required by Prisma
RUN apt-get update -y && apt-get install -y openssl

WORKDIR /app

# Copy dependency files
COPY package.json pnpm-lock.yaml* ./

# Install deps
RUN npm install

# Copy app
COPY . .

# ✅ Wait for DB + apply migrations
RUN npx prisma migrate deploy

# ✅ Pull real DB schema (VERY IMPORTANT)
RUN npx prisma db pull

# ✅ Regenerate client from REAL DB
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]