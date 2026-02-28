const { validationResult } = require('express-validator');

/**
 * Get all weight disputes for the logged-in user
 */
const getWeightDisputes = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const userId = req.user.id;
    const { page = 1, pageSize = 10, status } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSizeNum = parseInt(pageSize, 10);
    const offset = (pageNum - 1) * pageSizeNum;

    try {
        const where = { user_id: userId };
        if (status) where.status = status;

        const [disputes, total] = await prisma.$transaction([
            prisma.weightDispute.findMany({
                where,
                include: {
                    order: {
                        select: {
                            id: true,
                            tracking_number: true,
                            courier_name: true
                        }
                    }
                },
                skip: offset,
                take: pageSizeNum,
                orderBy: { created_at: 'desc' }
            }),
            prisma.weightDispute.count({ where })
        ]);

        res.json({
            data: disputes,
            pagination: {
                total,
                totalPages: Math.ceil(total / pageSizeNum),
                currentPage: pageNum,
                pageSize: pageSizeNum
            }
        });
    } catch (error) {
        console.error('Error fetching weight disputes:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Get all RTO disputes for the logged-in user
 */
const getRTODisputes = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const userId = req.user.id;
    const { page = 1, pageSize = 10, status } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSizeNum = parseInt(pageSize, 10);
    const offset = (pageNum - 1) * pageSizeNum;

    try {
        const where = { user_id: userId };
        if (status) where.status = status;

        const [disputes, total] = await prisma.$transaction([
            prisma.rTODispute.findMany({
                where,
                include: {
                    order: {
                        select: {
                            id: true,
                            tracking_number: true,
                            courier_name: true
                        }
                    }
                },
                skip: offset,
                take: pageSizeNum,
                orderBy: { created_at: 'desc' }
            }),
            prisma.rTODispute.count({ where })
        ]);

        res.json({
            data: disputes,
            pagination: {
                total,
                totalPages: Math.ceil(total / pageSizeNum),
                currentPage: pageNum,
                pageSize: pageSizeNum
            }
        });
    } catch (error) {
        console.error('Error fetching RTO disputes:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Create a weight dispute (Admin or System triggered)
 */
const createWeightDispute = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { order_id, charged_weight, charged_amount, action_reason } = req.body;

    try {
        const order = await prisma.order.findUnique({
            where: { id: BigInt(order_id) },
            select: { user_id: true, weight: true, shipping_charge: true }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const applied_weight = parseFloat(order.weight || 0);
        const applied_amount = parseFloat(order.shipping_charge || 0);
        const difference_amount = parseFloat(charged_amount) - applied_amount;

        const dispute = await prisma.weightDispute.create({
            data: {
                order_id: BigInt(order_id),
                user_id: order.user_id,
                applied_weight,
                charged_weight: parseFloat(charged_weight),
                applied_amount,
                charged_amount: parseFloat(charged_amount),
                difference_amount,
                action_reason,
                status: 'PENDING'
            }
        });

        res.status(201).json({ message: 'Weight dispute created successfully', data: dispute });
    } catch (error) {
        console.error('Error creating weight dispute:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Resolve a weight dispute and deduct from wallet if accepted
 */
const resolveWeightDispute = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { id } = req.params;
    const { status, action_reason } = req.body; // status: ACCEPTED or REJECTED

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const dispute = await tx.weightDispute.findUnique({
                where: { id },
                include: { user: true }
            });

            if (!dispute) {
                throw new Error('Dispute not found');
            }

            if (dispute.status !== 'PENDING') {
                throw new Error('Dispute already resolved');
            }

            const updatedDispute = await tx.weightDispute.update({
                where: { id },
                data: { status, action_reason, updated_at: new Date() }
            });

            // If accepted, deduct the difference from user's wallet
            if (status === 'ACCEPTED' && dispute.difference_amount > 0) {
                // Create a transaction record
                await tx.transaction.create({
                    data: {
                        user_id: dispute.user_id,
                        amount: dispute.difference_amount,
                        type: 'DEBIT',
                        category: 'ORDER_PAYMENT', // Or a new category like WEIGHT_DISPUTE
                        status: 'SUCCESS',
                        description: `Weight mismatch deduction for Order #${dispute.order_id}`,
                        reference_id: dispute.order_id.toString()
                    }
                });

                // Update user wallet
                await tx.user.update({
                    where: { id: dispute.user_id },
                    data: {
                        wallet_balance: { decrement: dispute.difference_amount }
                    }
                });
            }

            return updatedDispute;
        });

        res.json({ message: `Weight dispute ${status.toLowerCase()} successfully`, data: result });
    } catch (error) {
        console.error('Error resolving weight dispute:', error);
        res.status(400).json({ message: error.message || 'Internal Server Error' });
    }
};

/**
 * User raises a weight dispute
 */
const userRaiseWeightDispute = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const userId = req.user.id;
    const { 
        awb_number, 
        declared_weight, 
        charged_weight, 
        product_category, 
        description, 
        weight_scale_image, 
        packed_box_image 
    } = req.body;

    try {
        // Find the order by AWB (tracking_number)
        const order = await prisma.order.findFirst({
            where: { 
                tracking_number: awb_number,
                user_id: userId
            },
            select: { id: true, weight: true, shipping_charge: true }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order with this AWB number not found in your account.' });
        }

        const applied_weight = parseFloat(order.weight || 0);
        const applied_amount = parseFloat(order.shipping_charge || 0);
        
        // Use provided charged_weight or calculate from system if we had a way, 
        // but here the user says what they were charged.
        // We'll trust the user input for the dispute record creation.
        const diff_amount = 0; // Will be calculated by admin during resolution

        const dispute = await prisma.weightDispute.upsert({
            where: { order_id: order.id },
            update: {
                applied_weight,
                charged_weight: parseFloat(charged_weight),
                applied_amount,
                product_category,
                discrepancy_description: description,
                weight_scale_image,
                packed_box_image,
                status: 'PENDING',
                updated_at: new Date()
            },
            create: {
                order_id: order.id,
                user_id: userId,
                applied_weight,
                charged_weight: parseFloat(charged_weight),
                applied_amount,
                charged_amount: 0, // Admin will set this
                difference_amount: 0, // Admin will set this
                product_category,
                discrepancy_description: description,
                weight_scale_image,
                packed_box_image,
                status: 'PENDING'
            }
        });

        res.status(201).json({ message: 'Weight dispute request submitted successfully. Our experts will review it within 5-7 working days.', data: dispute });
    } catch (error) {
        console.error('Error raising weight dispute:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    getWeightDisputes,
    getRTODisputes,
    createWeightDispute,
    resolveWeightDispute,
    userRaiseWeightDispute
};
