
// Helper to get referral chain for multi-level commissions
const getReferralChain = async (prisma, userId, maxLevels = 10) => {
  const chain = [];
  let currentUserId = userId;
  let level = 0;

  console.log(`[Referral Chain] Starting for userId=${userId}, maxLevels=${maxLevels}`);

  while (level < maxLevels) {
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { id: true, referer_code: true, referred_by: true, commission_rate: true }
    });

    console.log(`[Referral Chain] Level ${level}: user=${currentUserId}, referred_by=${user?.referred_by}, rate=${user?.commission_rate}`);

    if (!user || !user.referred_by) {
      console.log(`[Referral Chain] Breaking at level ${level}: no user or no referred_by`);
      break;
    }

    // Find the referrer
    const referrer = await prisma.user.findUnique({
      where: { referer_code: user.referred_by },
      select: { id: true, referer_code: true, commission_rate: true }
    });

    if (!referrer) {
      console.log(`[Referral Chain] Breaking at level ${level}: referrer not found for code ${user.referred_by}`);
      break;
    }

    // Use the SHIPPER's commission_rate (what they charge their referrer), NOT the referrer's rate
    chain.push({
      level: level + 1,
      user_id: referrer.id,
      commission_rate: user.commission_rate ? parseFloat(user.commission_rate.toString()) : 0
    });

    console.log(`[Referral Chain] Added level ${level + 1}: referrer=${referrer.id}, shipper_rate=${user.commission_rate}`);

    currentUserId = referrer.id;
    level++;
  }

  console.log(`[Referral Chain] Complete: ${chain.length} levels in chain`);
  return chain;
};

// Helper to create network income commissions
// Logic: Each referral level gets flat % of base shipping rate (no cascading)
// Commission is only withdrawable after delivery, NOT added to wallet immediately
const createReferralCommissions = async (tx, orderId, userId, baseRate, maxLevels = 0) => {
  if (!baseRate || baseRate <= 0) return [];
  if (maxLevels <= 0) return [];

  const referralChain = await getReferralChain(tx, userId, maxLevels);
  if (referralChain.length === 0) return [];

  const createdCommissions = [];

  for (const node of referralChain) {
    const commissionAmount = (baseRate * node.commission_rate) / 100;

    if (commissionAmount > 0) {
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
      console.log(`[Referral Commission] Level ${node.level}: ${commissionAmount.toFixed(2)} to user ${node.user_id}`);
    }
  }

  console.log(`[Referral Commission] Created ${createdCommissions.length} commissions for order ${orderId}`);
  return createdCommissions;
};

module.exports = {
  getReferralChain,
  createReferralCommissions
};
