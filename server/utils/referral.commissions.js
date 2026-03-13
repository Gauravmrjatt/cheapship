
// Helper to get referral chain for multi-level commissions
const getReferralChain = async (prisma, userId, maxLevels = 10) => {
  const chain = [];
  let currentUserId = userId;
  let level = 0;

  while (level < maxLevels) {
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, referer_code: true, referred_by: true, commission_rate: true }
    });

    if (!user || !user.referred_by) break;
    // Find the referrer
    const referrer = await prisma.user.findUnique({
      where: { referer_code: user.referred_by },
      select: { id: true, referer_code: true, commission_rate: true }
    });
    if (!referrer) break;
    chain.push({
      level: level + 1,
      user_id: referrer.id,
      commission_rate: referrer.commission_rate ? parseFloat(referrer.commission_rate.toString()) : 0
    });

    currentUserId = referrer.id;
    level++;
  }

  return chain;
};

// Helper to create network income commissions
// Logic: Each referral level gets flat % of base shipping rate (no cascading)
const createReferralCommissions = async (tx, orderId, userId, baseRate, maxLevels = 0) => {
  if (!baseRate || baseRate <= 0) return [];
  if (maxLevels <= 0) return [];

  const referralChain = await getReferralChain(tx, userId, maxLevels);
  if (referralChain.length === 0) return [];

  const createdCommissions = [];

  // Each level gets flat % of baseRate (not cascading from previous level)
  for (const node of referralChain) {
    const commissionAmount = (baseRate * node.commission_rate) / 100;

    if (commissionAmount > 0) {
      await tx.user.update({
        where: { id: node.user_id },
        data: { wallet_balance: { increment: commissionAmount } }
      });

      const commission = await tx.orderReferralCommission.create({
        data: {
          order_id: orderId,
          level: node.level,
          referrer_id: node.user_id,
          amount: commissionAmount,
          is_withdrawn: false
        }
      });

      createdCommissions.push(commission);
    }
  }

  return createdCommissions;
};

module.exports = {
  getReferralChain,
  createReferralCommissions
};

