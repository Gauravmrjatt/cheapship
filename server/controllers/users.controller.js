const { validationResult } = require('express-validator');

/**
 * Update user's own commission sharing rate
 */
const updateCommissionRate = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const userId = req.user.id;
    const { commission_rate } = req.body;

    if (commission_rate === undefined || isNaN(parseFloat(commission_rate))) {
        return res.status(400).json({ message: 'Invalid commission rate provided.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { min_commission_rate: true, max_commission_rate: true }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const rateNum = parseFloat(commission_rate);
        const minRate = user.min_commission_rate ? parseFloat(user.min_commission_rate.toString()) : 0;
        const maxRate = user.max_commission_rate ? parseFloat(user.max_commission_rate.toString()) : 100;

        if (rateNum < minRate || rateNum > maxRate) {
            return res.status(400).json({
                message: `Commission rate must be between ${minRate}% and ${maxRate}%.`
            });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { commission_rate: rateNum }
        });

        res.json({ success: true, message: 'Commission rate updated successfully.', rate: rateNum });
    } catch (error) {
        console.error('Update commission rate error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Set a default pickup address for referrals
 */
const setDefaultReferredPickup = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const userId = req.user.id;
    const { address_id } = req.body;

    if (!address_id) {
        return res.status(400).json({ message: 'Address ID is required.' });
    }

    try {
        // Verify the address belongs to the user
        const address = await prisma.address.findFirst({
            where: { id: address_id, user_id: userId }
        });

        if (!address) {
            return res.status(404).json({ message: 'Address not found or does not belong to you.' });
        }

        await prisma.user.update({
            where: { id: userId },
            data: { default_referred_pickup_id: address_id }
        });

        res.json({ success: true, message: 'Default signup address updated successfully.' });
    } catch (error) {
        console.error('Set default pickup error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Get user profile with custom referral settings
 */
const getProfile = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const userId = req.user.id;

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                mobile: true,
                commission_rate: true,
                min_commission_rate: true,
                max_commission_rate: true,
                default_referred_pickup_id: true,
                referer_code: true
            }
        });

        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Get current user's security deposits
const getUserSecurityDeposits = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const userId = req.user.id;

    try {
        const { page = 1, pageSize = 20, status } = req.query;
        
        const pageNum = Math.max(1, parseInt(page, 10));
        const pageSizeNum = parseInt(pageSize, 10);
        const offset = (pageNum - 1) * pageSizeNum;

        const where = { user_id: userId };
        if (status) {
            where.status = status;
        }

        const [deposits, total] = await Promise.all([
            prisma.securityDeposit.findMany({
                where,
                include: {
                    order: {
                        select: {
                            id: true,
                            shipment_status: true,
                            total_amount: true,
                            shipping_charge: true,
                            tracking_number: true,
                            courier_name: true,
                            shiprocket_order_id: true,
                            shiprocket_shipment_id: true,
                            order_type: true,
                            payment_mode: true,
                            created_at: true,
                            delivered_at: true
                        }
                    }
                },
                orderBy: { created_at: 'desc' },
                skip: offset,
                take: pageSizeNum
            }),
            prisma.securityDeposit.count({ where })
        ]);

        // Calculate totals
        const totals = await prisma.securityDeposit.aggregate({
            where: { user_id: userId },
            _sum: {
                amount: true,
                used_amount: true,
                remaining: true
            }
        });

        res.json({
            data: deposits,
            totals: {
                totalAmount: totals._sum.amount || 0,
                totalUsed: totals._sum.used_amount || 0,
                totalRemaining: totals._sum.remaining || 0
            },
            pagination: {
                total,
                totalPages: Math.ceil(total / pageSizeNum),
                currentPage: pageNum,
                pageSize: pageSizeNum
            }
        });
    } catch (error) {
        console.error('Get security deposits error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    updateCommissionRate,
    setDefaultReferredPickup,
    getProfile,
    getUserSecurityDeposits
};
