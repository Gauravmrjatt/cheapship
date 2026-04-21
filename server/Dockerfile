FROM ubuntu:24.04

RUN apt-get update && apt-get install -y \
    curl \
    openssl \
    ca-certificates \
    locales \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN npm install

COPY . .

RUN npx prisma migrate resolve --applied 20260227000000_add_transaction_categories || true
RUN npx prisma migrate deploy
RUN npx prisma db pull
RUN npx prisma generate

EXPOSE 3001

CMD ["npm", "start"]