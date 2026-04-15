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
                            courier_name: true,
                            length: true,
                            width: true,
                            height: true
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
 * Get single weight dispute by ID for the logged-in user
 */
const getWeightDisputeById = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const dispute = await prisma.weightDispute.findFirst({
            where: { id, user_id: userId },
            include: {
                order: {
                    select: {
                        id: true,
                        tracking_number: true,
                        courier_name: true,
                        length: true,
                        width: true,
                        height: true,
                        weight: true,
                        shipping_charge: true,
                        shipment_status: true,
                        created_at: true
                    }
                }
            }
        });

        if (!dispute) {
            return res.status(404).json({ message: 'Weight dispute not found' });
        }

        res.json({ data: dispute });
    } catch (error) {
        console.error('Error fetching weight dispute:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Get single RTO dispute by ID for the logged-in user
 */
const getRTODisputeById = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const dispute = await prisma.rTODispute.findFirst({
            where: { id, user_id: userId },
            include: {
                order: {
                    select: {
                        id: true,
                        tracking_number: true,
                        courier_name: true,
                        shipment_status: true,
                        rto_charges: true,
                        created_at: true
                    }
                }
            }
        });

        if (!dispute) {
            return res.status(404).json({ message: 'RTO dispute not found' });
        }

        res.json({ data: dispute });
    } catch (error) {
        console.error('Error fetching RTO dispute:', error);
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
                // Update user wallet first
                await tx.user.update({
                    where: { id: dispute.user_id },
                    data: {
                        wallet_balance: { decrement: dispute.difference_amount }
                    }
                });

                // Get updated wallet balance
                const updatedUser = await tx.user.findUnique({
                    where: { id: dispute.user_id },
                    select: { wallet_balance: true }
                });

                // Create a transaction record with closing_balance
                await tx.transaction.create({
                    data: {
                        user_id: dispute.user_id,
                        amount: dispute.difference_amount,
                        closing_balance: Number(updatedUser.wallet_balance),
                        type: 'DEBIT',
                        category: 'ORDER_PAYMENT', // Or a new category like WEIGHT_DISPUTE
                        status: 'SUCCESS',
                        description: `Weight mismatch deduction for Order #${dispute.order_id}`,
                        reference_id: dispute.order_id.toString()
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

/**
 * Get all weight disputes (Admin view)
 */
const getAllWeightDisputes = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { page = 1, pageSize = 10, status, search } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSizeNum = parseInt(pageSize, 10);
    const offset = (pageNum - 1) * pageSizeNum;

    try {
        const where = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            const searchTerm = search.trim();
            const isNumeric = /^\d+$/.test(searchTerm);
            const orConditions = [];

            if (isNumeric) {
                try {
                    orConditions.push({ order_id: { equals: BigInt(searchTerm) } });
                } catch (e) {
                    // Invalid number
                }
            }

            orConditions.push(
                { user: { mobile: { contains: searchTerm } } },
                { user: { email: { contains: searchTerm } } },
                { user: { name: { contains: searchTerm } } }
            );

            const matchingUsers = await prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { email: { contains: searchTerm, mode: 'insensitive' } },
                        { mobile: { contains: searchTerm } }
                    ]
                },
                select: { id: true }
            });
            
            if (matchingUsers.length > 0) {
                const userIds = matchingUsers.map(u => u.id);
                orConditions.push({ user_id: { in: userIds } });
            }

            where.OR = orConditions;
        }

        const [disputes, total] = await prisma.$transaction([
            prisma.weightDispute.findMany({
                where,
                include: {
                    order: {
                        select: {
                            id: true,
                            tracking_number: true,
                            courier_name: true,
                            weight: true,
                            shipping_charge: true,
                            shipment_status: true,
                            length: true,
                            width: true,
                            height: true
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            mobile: true,
                            wallet_balance: true,
                            security_deposit: true
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
        console.error('Error fetching all weight disputes:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Search orders for dispute creation (Admin)
 */
const searchOrdersForDispute = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { search } = req.query;

    if (!search || search.length < 2) {
        return res.json({ data: [] });
    }

    try {
        const isNumeric = /^\d+$/.test(search);
        let searchNum;
        let orderIdFilter = null;

        if (isNumeric) {
            try {
                searchNum = BigInt(search);
                orderIdFilter = { id: searchNum };
            } catch (e) {
                // Invalid number, ignore
            }
        }

        const orders = await prisma.order.findMany({
            where: {
                OR: [
                    ...(orderIdFilter ? [orderIdFilter] : []),
                    { shiprocket_order_id: { contains: search, mode: 'insensitive' } },
                    { shiprocket_shipment_id: { contains: search, mode: 'insensitive' } },
                    { tracking_number: { contains: search, mode: 'insensitive' } },
                    { user: { mobile: { contains: search } } },
                    { user: { email: { contains: search, mode: 'insensitive' } } }
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        mobile: true,
                        wallet_balance: true,
                        security_deposit: true
                    }
                },
                weight_dispute: {
                    select: {
                        id: true,
                        status: true,
                        difference_amount: true
                    }
                }
            },
            take: 20,
            orderBy: { created_at: 'desc' }
        });

        res.json({ data: orders });
    } catch (error) {
        console.error('Error searching orders:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Admin creates weight dispute with wallet deduction/addition
 * Security: No duplicate disputes for same order allowed
 * Wallet logic: Deduct from security_deposit first, then wallet_balance (allow negative)
 */
const adminCreateWeightDispute = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const {
        order_id,
        weight_type, // 'LESS' or 'MORE'
        applied_weight, // Weight in grams
        charged_weight, // Weight in grams  
        amount, // Amount to deduct (positive) or add (negative)
        action_reason,
        discrepancy_description
    } = req.body;

    try {
        const orderId = BigInt(order_id);

        // Check for existing dispute for this order
        const existingDispute = await prisma.weightDispute.findUnique({
            where: { order_id: orderId }
        });

        if (existingDispute) {
            return res.status(400).json({
                message: 'Weight dispute already exists for this order. Please resolve or reject the existing dispute first.'
            });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                user_id: true,
                weight: true,
                shipping_charge: true,
                base_shipping_charge: true
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const appliedWeight = parseFloat(applied_weight) / 1000; // Convert grams to kg
        const chargedWeight = parseFloat(charged_weight) / 1000;
        const amountValue = parseFloat(amount);

        // Determine status based on amount: Positive = ACCEPTED (deduct), Negative = ACCEPTED (refund)
        const status = 'ACCEPTED';

        const result = await prisma.$transaction(async (tx) => {
            // Get current user wallet info
            const user = await tx.user.findUnique({
                where: { id: order.user_id },
                select: {
                    wallet_balance: true,
                    security_deposit: true
                }
            });

            let newWalletBalance = Number(user.wallet_balance);
            let newSecurityDeposit = Number(user.security_deposit);
            let securityDeducted = 0;
            let walletDeducted = 0;
            let walletAdded = 0;

            if (amountValue > 0) {
                // Deduction case - take from security_deposit first (no cap), then wallet_balance
                let remainingAmount = amountValue;

                // First deduct from security_deposit (no cap - full amount)
                if (newSecurityDeposit > 0) {
                    if (newSecurityDeposit >= remainingAmount) {
                        securityDeducted = remainingAmount;
                        newSecurityDeposit -= remainingAmount;
                        remainingAmount = 0;
                    } else {
                        securityDeducted = newSecurityDeposit;
                        remainingAmount -= newSecurityDeposit;
                        newSecurityDeposit = 0;
                    }
                }

                // Then deduct from wallet_balance if needed
                if (remainingAmount > 0) {
                    walletDeducted = remainingAmount;
                    newWalletBalance -= remainingAmount;
                    // Allow negative balance as per requirement
                }

                // Update user wallets
                await tx.user.update({
                    where: { id: order.user_id },
                    data: {
                        wallet_balance: newWalletBalance,
                        security_deposit: newSecurityDeposit
                    }
                });

                // Create transaction record for security deposit deduction
                if (securityDeducted > 0) {
                    await tx.transaction.create({
                        data: {
                            user_id: order.user_id,
                            amount: securityDeducted,
                            closing_balance: newSecurityDeposit,
                            type: 'DEBIT',
                            category: 'SECURITY_DEPOSIT',
                            status: 'SUCCESS',
                            description: `Weight dispute for Order #${order_id}. Security deposit deduction: ₹${securityDeducted}`,
                            reference_id: order_id.toString()
                        }
                    });

                    // Update SecurityDeposit record for tracking
                    const securityDepositRecord = await tx.securityDeposit.findFirst({
                        where: { order_id: orderId, user_id: order.user_id }
                    });

                    if (securityDepositRecord) {
                        const newUsedAmount = Number(securityDepositRecord.used_amount) + securityDeducted;
                        const newRemaining = Number(securityDepositRecord.amount) - newUsedAmount;
                        
                        await tx.securityDeposit.update({
                            where: { id: securityDepositRecord.id },
                            data: {
                                used_amount: newUsedAmount,
                                remaining: Math.max(0, newRemaining),
                                status: newRemaining <= 0 ? 'FULLY_USED' : 'PARTIAL',
                                updated_at: new Date()
                            }
                        });
                    }
                }

                // Create transaction record for wallet deduction (if any)
                if (walletDeducted > 0) {
                    await tx.transaction.create({
                        data: {
                            user_id: order.user_id,
                            amount: walletDeducted,
                            closing_balance: newWalletBalance,
                            type: 'DEBIT',
                            category: 'WEIGHT_DISPUTE',
                            status: 'SUCCESS',
                            description: `Weight dispute for Order #${order_id}. Wallet deduction: ₹${walletDeducted}`,
                            reference_id: order_id.toString()
                        }
                    });
                }

            } else if (amountValue < 0) {
                // Addition case - add to wallet_balance
                const amountToAdd = Math.abs(amountValue);
                walletAdded = amountToAdd;
                newWalletBalance += amountToAdd;

                // Update user wallet
                await tx.user.update({
                    where: { id: order.user_id },
                    data: {
                        wallet_balance: newWalletBalance
                    }
                });

                // Create CREDIT transaction for addition
                await tx.transaction.create({
                    data: {
                        user_id: order.user_id,
                        amount: amountToAdd,
                        closing_balance: newWalletBalance,
                        type: 'CREDIT',
                        category: 'WEIGHT_DISPUTE',
                        status: 'SUCCESS',
                        description: `Weight dispute refund - ${weight_type} weight. Order #${order_id}`,
                        reference_id: order_id.toString()
                    }
                });
            }

            // Create the weight dispute record
            const dispute = await tx.weightDispute.create({
                data: {
                    order_id: orderId,
                    user_id: order.user_id,
                    applied_weight: appliedWeight,
                    charged_weight: chargedWeight,
                    applied_amount: parseFloat(order.shipping_charge || 0),
                    charged_amount: amountValue > 0 ? parseFloat(order.shipping_charge || 0) + amountValue : parseFloat(order.shipping_charge || 0),
                    difference_amount: amountValue,
                    status: status,
                    action_reason: action_reason,
                    discrepancy_description: discrepancy_description || `Admin created: ${weight_type} weight (${appliedWeight}kg -> ${chargedWeight}kg)`
                }
            });

            return {
                dispute,
                walletChanges: {
                    previousWalletBalance: Number(user.wallet_balance),
                    newWalletBalance,
                    previousSecurityDeposit: Number(user.security_deposit),
                    newSecurityDeposit,
                    securityDeducted,
                    walletDeducted,
                    walletAdded
                }
            };
        });

        res.status(201).json({
            message: 'Weight dispute created successfully',
            data: result
        });
    } catch (error) {
        console.error('Error creating weight dispute:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Get all RTO disputes (Admin view)
 */
const getAllRTODisputes = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { page = 1, pageSize = 10, status, search } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSizeNum = parseInt(pageSize, 10);
    const offset = (pageNum - 1) * pageSizeNum;

    try {
        const where = {};

        if (status) {
            where.status = status;
        }

        if (search) {
            const searchTerm = search.trim();
            const isNumeric = /^\d+$/.test(searchTerm);
            const orConditions = [];

            if (isNumeric) {
                try {
                    orConditions.push({ order_id: { equals: BigInt(searchTerm) } });
                } catch (e) {
                    // Invalid number
                }
            }

            orConditions.push(
                { user: { mobile: { contains: searchTerm } } },
                { user: { email: { contains: searchTerm } } },
                { user: { name: { contains: searchTerm } } }
            );

            const matchingUsers = await prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { email: { contains: searchTerm, mode: 'insensitive' } },
                        { mobile: { contains: searchTerm } }
                    ]
                },
                select: { id: true }
            });
            
            if (matchingUsers.length > 0) {
                const userIds = matchingUsers.map(u => u.id);
                orConditions.push({ user_id: { in: userIds } });
            }

            where.OR = orConditions;
        }

        const [disputes, total] = await prisma.$transaction([
            prisma.rTODispute.findMany({
                where,
                include: {
                    order: {
                        select: {
                            id: true,
                            tracking_number: true,
                            courier_name: true,
                            shipment_status: true,
                            rto_charges: true
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            mobile: true,
                            wallet_balance: true,
                            security_deposit: true
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
        console.error('Error fetching all RTO disputes:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Search orders for RTO (Admin)
 */
const searchOrdersForRTO = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { search } = req.query;

    if (!search || search.length < 2) {
        return res.json({ data: [] });
    }

    try {
        const isNumeric = /^\d+$/.test(search);
        let orderIdFilter = null;

        if (isNumeric) {
            try {
                orderIdFilter = { id: BigInt(search) };
            } catch (e) {
                // Invalid number
            }
        }

        const orders = await prisma.order.findMany({
            where: {
                OR: [
                    ...(orderIdFilter ? [orderIdFilter] : []),
                    { shiprocket_order_id: { contains: search, mode: 'insensitive' } },
                    { shiprocket_shipment_id: { contains: search, mode: 'insensitive' } },
                    { tracking_number: { contains: search, mode: 'insensitive' } },
                    { user: { mobile: { contains: search } } },
                    { user: { email: { contains: search, mode: 'insensitive' } } }
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        mobile: true,
                        wallet_balance: true,
                        security_deposit: true
                    }
                },
                rto_dispute: {
                    select: {
                        id: true,
                        status: true
                    }
                }
            },
            take: 20,
            orderBy: { created_at: 'desc' }
        });

        res.json({ data: orders });
    } catch (error) {
        console.error('Error searching orders for RTO:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Admin creates RTO dispute with wallet deduction
 * Security: No duplicate RTO per order
 * Wallet: Deduct from security_deposit first, then wallet_balance (allow negative)
 */
const adminCreateRTODispute = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const {
        order_id,
        amount,
        reason
    } = req.body;

    try {
        const orderId = BigInt(order_id);

        // Check for existing RTO dispute for this order
        const existingRTO = await prisma.rTODispute.findUnique({
            where: { order_id: orderId }
        });

        if (existingRTO) {
            return res.status(400).json({
                message: 'RTO already exists for this order. Please resolve or reject the existing RTO first.'
            });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                user_id: true,
                rto_charges: true
            }
        });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const amountValue = parseFloat(amount);

        const result = await prisma.$transaction(async (tx) => {
            // Get current user wallet info
            const user = await tx.user.findUnique({
                where: { id: order.user_id },
                select: {
                    wallet_balance: true,
                    security_deposit: true
                }
            });

            let newWalletBalance = Number(user.wallet_balance);
            let newSecurityDeposit = Number(user.security_deposit);
            let securityDeducted = 0;
            let walletDeducted = 0;

            // Deduct from security_deposit first (no cap), then wallet_balance
            if (amountValue > 0) {
                let remainingAmount = amountValue;

                // First deduct from security_deposit (no cap - full amount)
                if (newSecurityDeposit > 0) {
                    if (newSecurityDeposit >= remainingAmount) {
                        securityDeducted = remainingAmount;
                        newSecurityDeposit -= remainingAmount;
                        remainingAmount = 0;
                    } else {
                        securityDeducted = newSecurityDeposit;
                        remainingAmount -= newSecurityDeposit;
                        newSecurityDeposit = 0;
                    }
                }

                // Then deduct from wallet_balance if needed
                if (remainingAmount > 0) {
                    walletDeducted = remainingAmount;
                    newWalletBalance -= remainingAmount;
                }

                // Update user wallets
                await tx.user.update({
                    where: { id: order.user_id },
                    data: {
                        wallet_balance: newWalletBalance,
                        security_deposit: newSecurityDeposit
                    }
                });

                // Create transaction record for security deposit deduction
                if (securityDeducted > 0) {
                    await tx.transaction.create({
                        data: {
                            user_id: order.user_id,
                            amount: securityDeducted,
                            closing_balance: newSecurityDeposit,
                            type: 'DEBIT',
                            category: 'SECURITY_DEPOSIT',
                            status: 'SUCCESS',
                            description: `RTO charge for Order #${order_id}. Security deposit deduction: ₹${securityDeducted}`,
                            reference_id: order_id.toString()
                        }
                    });

                    // Update SecurityDeposit record for tracking
                    const securityDepositRecord = await tx.securityDeposit.findFirst({
                        where: { order_id: orderId, user_id: order.user_id }
                    });

                    if (securityDepositRecord) {
                        const newUsedAmount = Number(securityDepositRecord.used_amount) + securityDeducted;
                        const newRemaining = Number(securityDepositRecord.amount) - newUsedAmount;
                        
                        await tx.securityDeposit.update({
                            where: { id: securityDepositRecord.id },
                            data: {
                                used_amount: newUsedAmount,
                                remaining: Math.max(0, newRemaining),
                                status: newRemaining <= 0 ? 'FULLY_USED' : 'PARTIAL',
                                updated_at: new Date()
                            }
                        });
                    }
                }

                // Create transaction record for wallet deduction (if any)
                if (walletDeducted > 0) {
                    await tx.transaction.create({
                        data: {
                            user_id: order.user_id,
                            amount: walletDeducted,
                            closing_balance: newWalletBalance,
                            type: 'DEBIT',
                            category: 'RTO_CHARGE',
                            status: 'SUCCESS',
                            description: `RTO charge for Order #${order_id}. Wallet deduction: ₹${walletDeducted}`,
                            reference_id: order_id.toString()
                        }
                    });
                }
            }

            // Create RTO dispute record (auto ACCEPTED)
            const rtoDispute = await tx.rTODispute.create({
                data: {
                    order_id: orderId,
                    user_id: order.user_id,
                    reason: reason || 'RTO charge',
                    status: 'ACCEPTED',
                    action_reason: `RTO processed. Amount: ₹${amountValue}`
                }
            });

            return {
                rtoDispute,
                walletChanges: {
                    previousWalletBalance: Number(user.wallet_balance),
                    newWalletBalance,
                    previousSecurityDeposit: Number(user.security_deposit),
                    newSecurityDeposit,
                    securityDeducted,
                    walletDeducted
                }
            };
        });

        res.status(201).json({
            message: 'RTO created successfully',
            data: result
        });
    } catch (error) {
        console.error('Error creating RTO dispute:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    getWeightDisputes,
    getRTODisputes,
    getWeightDisputeById,
    getRTODisputeById,
    createWeightDispute,
    resolveWeightDispute,
    userRaiseWeightDispute,
    getAllWeightDisputes,
    searchOrdersForDispute,
    adminCreateWeightDispute,
    getAllRTODisputes,
    searchOrdersForRTO,
    adminCreateRTODispute
};
