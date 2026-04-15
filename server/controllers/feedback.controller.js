const { validationResult } = require('express-validator');

/**
 * Submit user feedback or complaint
 */
const submitFeedback = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const userId = req.user.id;
    const { subject, message, type } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const feedback = await prisma.feedback.create({
            data: {
                user_id: userId,
                subject,
                message,
                type: type || 'FEEDBACK'
            }
        });

        res.status(201).json({
            message: 'Feedback submitted successfully',
            data: feedback
        });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Get all feedbacks (Admin only typically, but adding for completeness)
 */
const getFeedbacks = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { page = 1, pageSize = 10, type, search } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const pageSizeNum = parseInt(pageSize, 10);
    const offset = (pageNum - 1) * pageSizeNum;

    try {
        const where = {};
        if (type) where.type = type;

        if (search) {
            const searchTerm = search.trim();
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
                where.user_id = { in: userIds };
            } else {
                return res.json({
                    data: [],
                    pagination: {
                        total: 0,
                        totalPages: 0,
                        currentPage: pageNum,
                        pageSize: pageSizeNum
                    }
                });
            }
        }

        const [feedbacks, total] = await prisma.$transaction([
            prisma.feedback.findMany({
                where,
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                            mobile: true
                        }
                    }
                },
                skip: offset,
                take: pageSizeNum,
                orderBy: { created_at: 'desc' }
            }),
            prisma.feedback.count({ where })
        ]);

        res.json({
            data: feedbacks,
            pagination: {
                total,
                totalPages: Math.ceil(total / pageSizeNum),
                currentPage: pageNum,
                pageSize: pageSizeNum
            }
        });
    } catch (error) {
        console.error('Error fetching feedbacks:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getFeedbackById = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { id } = req.params;

    try {
        const feedback = await prisma.feedback.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        mobile: true
                    }
                }
            }
        });

        if (!feedback) {
            return res.status(404).json({ message: 'Feedback not found' });
        }

        res.json({
            data: feedback
        });
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    submitFeedback,
    getFeedbacks,
    getFeedbackById
};
