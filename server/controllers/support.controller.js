const { validationResult } = require('express-validator');

const createTicket = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { subject, message } = req.body;
    const prisma = req.app.locals.prisma;
    const userId = req.user.id;

    try {
        const ticket = await prisma.supportTicket.create({
            data: {
                user_id: userId,
                subject,
                message,
                status: 'OPEN'
            }
        });

        res.status(201).json({
            message: 'Ticket created successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getMyTickets = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const userId = req.user.id;

    try {
        const tickets = await prisma.supportTicket.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' }
        });

        res.json({ data: tickets });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getAllTickets = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { status, page = 1, limit = 20, search } = req.query;

    try {
        const where = {};
        if (status && status !== 'ALL') {
            where.status = status;
        }

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
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: 0,
                        totalPages: 0
                    }
                });
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [tickets, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            mobile: true
                        }
                    }
                },
                orderBy: { created_at: 'desc' },
                skip,
                take: parseInt(limit)
            }),
            prisma.supportTicket.count({ where })
        ]);

        res.json({
            data: tickets,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching all tickets:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const updateTicketStatus = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { id } = req.params;
    const { status, response } = req.body;

    try {
        const ticket = await prisma.supportTicket.findUnique({
            where: { id }
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        const updatedTicket = await prisma.supportTicket.update({
            where: { id },
            data: { status }
        });

        res.json({
            message: 'Ticket status updated successfully',
            data: updatedTicket
        });
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getTicketById = async (req, res) => {
    const prisma = req.app.locals.prisma;
    const { id } = req.params;

    try {
        const ticket = await prisma.supportTicket.findUnique({
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

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.json({ data: ticket });
    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = {
    createTicket,
    getMyTickets,
    getAllTickets,
    updateTicketStatus,
    getTicketById
};
