FROM node:22-bookworm

RUN apt-get update && apt-get install -y \
    curl \
    openssl \
    ca-certificates \
    locales \
    ghostscript \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN npm install

COPY . .

RUN npx prisma migrate resolve --applied 20260227000000_add_transaction_categories || true
RUN npx prisma migrate resolve --applied 20260423000001_add_bank_fields_and_payment_method || true
RUN npx prisma migrate deploy
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]