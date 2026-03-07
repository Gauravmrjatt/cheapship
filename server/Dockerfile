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

# ✅ Resolve failed migrations (if any) - idempotent approach
RUN npx prisma migrate resolve --applied 20260227000000_add_transaction_categories 2>/dev/null || true

# ✅ Wait for DB + apply migrations
RUN npx prisma migrate deploy

# ✅ Pull real DB schema (VERY IMPORTANT)
RUN npx prisma db pull

# ✅ Regenerate client from REAL DB
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]