import express from 'express';
import SupportTicket from '../models/SupportTicket.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { email, issueType, message, userId } = req.body;

        if (!email || !issueType || !message) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newTicket = new SupportTicket({
            email,
            issueType,
            message,
            userId: userId || null
        });

        await newTicket.save();

        res.status(201).json({ message: 'Support ticket created successfully', ticket: newTicket });
    } catch (error) {
        console.error('Error creating support ticket:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
