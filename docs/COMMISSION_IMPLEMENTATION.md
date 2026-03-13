# Commission Implementation Guide

## Current Implementation (Shipping Charge-Based - Active)

**Date:** March 13, 2026

### Structure: A → B → C
- A refers B
- B refers C
- When C ships an order:
  - **B (Level 1)** gets direct commission on `base_shipping_charge` × B's commission_rate
  - **A (Level 2)** gets direct commission on `base_shipping_charge` × A's commission_rate (not cascading from B)
  - Each subsequent level gets commission directly on shipping charge using their own rate

### Key Files:
- `server/utils/referral.commissions.js` - Core commission logic
- `server/controllers/order.controller.js` - Where commissions are triggered

---

## Previous Implementation (Profit-Based Cascade - Reverted)

### Structure: A → B → C
- A refers B
- B refers C
- When C ships an order:
  - **B (Level 1)** gets commission on `franchise_commission_amount` (profit)
  - **A (Level 2)** gets commission based on B's commission_rate % of B's commission amount (cascading profit)
  - Each subsequent level gets % of the previous level's commission

### To Revert (Restore Profit-Based Cascade):

1. **In `server/controllers/order.controller.js`** (around line 702):
   ```javascript
   // Change FROM:
   // Create multi-level referral commissions on shipping charges (direct, not cascading)
   const baseCommissionAmount = parseFloat(order.base_shipping_charge || 0);
   
   // Change TO:
   // Create multi-level referral commissions with cascading percentages
   const baseCommissionAmount = parseFloat(order.franchise_commission_amount || 0);
   ```

2. **In `server/utils/referral.commissions.js`**, replace the entire `createReferralCommissions` function with:

   ```javascript
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
   ```

---

## Summary of Changes Made (Shipping Charge-Based):

### 1. `server/controllers/order.controller.js` (line ~702):
```javascript
// Changed FROM (profit-based):
const baseCommissionAmount = parseFloat(order.franchise_commission_amount || 0);

// Changed TO (shipping charge-based):
// Create multi-level referral commissions on shipping charges (direct, not cascading)
const baseCommissionAmount = parseFloat(order.base_shipping_charge || 0);
```

### 2. `server/utils/referral.commissions.js`:
- Changed from cascading profit logic to direct shipping charge commission
- Each level now calculates commission as: `shipping_charge × their_commission_rate / 100`
- No longer cascades from previous level's commission amount
