import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import Agent from '../models/Agents.js';
import { verifyToken } from '../middleware/authorization.js';

dotenv.config();

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create Order
// POST /api/payments/create-order
router.post('/create-order', verifyToken, async (req, res) => {
    try {
        const { amount, agentId, plan } = req.body;

        if (!amount || !agentId) {
            return res.status(400).json({ error: 'Amount and Agent ID are required' });
        }

        const options = {
            amount: amount * 100, // exact amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error('[RAZORPAY ORDER ERROR]', err);
        res.status(500).json({ error: 'Failed to create payment order' });
    }
});

// Verify Payment
// POST /api/payments/verify
router.post('/verify', verifyToken, async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            agentId,
            amount,
            plan
        } = req.body;

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // Payment successful

            // 1. Fetch Agent to find Vendor
            const agent = await Agent.findById(agentId);
            if (!agent) {
                return res.status(404).json({ error: 'Agent not found' });
            }

            // 2. Create Transaction Record
            const transaction = new Transaction({
                transactionId: razorpay_payment_id,
                buyerId: req.user.id,
                vendorId: agent.owner,
                agentId: agentId,
                amount: amount,
                platformFee: amount * 0.5, // 50% commission
                netAmount: amount * 0.5,
                status: 'Success',
            });
            await transaction.save();

            // 3. Add Agent to User
            await User.findByIdAndUpdate(req.user.id, {
                $addToSet: { agents: agentId }
            });

            return res.json({ message: "Payment verified successfully", success: true });
        } else {
            return res.status(400).json({ error: "Invalid payment signature", success: false });
        }
    } catch (err) {
        console.error('[RAZORPAY VERIFY ERROR]', err);
        res.status(500).json({ error: 'Failed to verify payment' });
    }
});

export default router;
