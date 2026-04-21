FROM node:22.12-slim

# ✅ Install required system libs (FIX)
RUN apt-get update && apt-get install -y \
    openssl \
    libgraphite2-3 \
    libharfbuzz0b \
    libfreetype6 \
    libfontconfig1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN npm install

COPY . .

# Prisma steps
RUN npx prisma migrate resolve --applied 20260227000000_add_transaction_categories || true
RUN npx prisma migrate deploy
RUN npx prisma db pull
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]