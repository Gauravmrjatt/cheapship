const NodeCache = require('node-cache');
const prisma = require('./prisma');

const TOKEN_TTL_SECONDS = 5 * 24 * 60 * 60; // 5 days, matches JWT expiresIn

const cache = new NodeCache({
  stdTTL: TOKEN_TTL_SECONDS,
  checkperiod: 60,
  useClones: false
});

const block = (userId) => {
  cache.set(userId, true);
};

const unblock = (userId) => {
  cache.del(userId);
};

const isBlocked = (userId) => {
  return cache.get(userId) !== undefined;
};

const seed = async () => {
  try {
    const blockedUsers = await prisma.user.findMany({
      where: { is_active: false },
      select: { id: true }
    });

    for (const user of blockedUsers) {
      cache.set(user.id, true);
    }

    if (blockedUsers.length > 0) {
      console.log(`✅ Loaded ${blockedUsers.length} blocked user(s) into cache`);
    }
  } catch (error) {
    console.error('Failed to seed blocked users cache:', error);
  }
};

module.exports = { block, unblock, isBlocked, seed };