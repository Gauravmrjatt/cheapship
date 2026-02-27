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

module.exports = {
    createTicket,
    getMyTickets
};
