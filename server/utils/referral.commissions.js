
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
// Logic: Level 1 (Direct Referrer B) gets baseCommissionAmount (markup from the order).
// Level 2 (A) gets a percentage of B's profit based on B's commission_rate.
// Level 3 (X) gets a percentage of A's profit based on A's commission_rate.
const createReferralCommissions = async (tx, orderId, userId, baseCommissionAmount, maxLevels = 0) => {
  // baseCommissionAmount is the profit of the direct referrer (Level 1)
  if (!baseCommissionAmount || baseCommissionAmount <= 0) return [];
  if (maxLevels <= 0) return [];

  // Get the referral chain
  const referralChain = await getReferralChain(tx, userId, maxLevels);
  if (referralChain.length === 0) return []; // No referrers at all

  const createdCommissions = [];

  // Level 1: Credit the direct referrer with the full baseCommissionAmount
  const level1Node = referralChain[0];
  if (level1Node) {
    await tx.user.update({
      where: { id: level1Node.user_id },
      data: { wallet_balance: { increment: baseCommissionAmount } }
    });

    const commission = await tx.orderReferralCommission.create({
      data: {
        order_id: orderId,
        level: level1Node.level,
        referrer_id: level1Node.user_id,
        amount: baseCommissionAmount,
        is_withdrawn: false
      }
    });

    createdCommissions.push(commission);
  }

  // Level 2+: Each level gets commission based on the previous level's profit
  let currentBaseAmount = baseCommissionAmount;

  for (let i = 1; i < referralChain.length; i++) {
    const receiverNode = referralChain[i];
    const giverNode = referralChain[i - 1];

    const rate = giverNode.commission_rate;

    if (rate > 0) {
      const commissionAmount = (currentBaseAmount * rate) / 100;

      if (commissionAmount > 0) {
        await tx.user.update({
          where: { id: receiverNode.user_id },
          data: { wallet_balance: { increment: commissionAmount } }
        });

        const commission = await tx.orderReferralCommission.create({
          data: {
            order_id: orderId,
            level: receiverNode.level,
            referrer_id: receiverNode.user_id,
            amount: commissionAmount,
            is_withdrawn: false
          }
        });

        createdCommissions.push(commission);

        currentBaseAmount = commissionAmount;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return createdCommissions;
};

module.exports = {
  getReferralChain,
  createReferralCommissions
};

