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

// Razorpay initialized inside routes to ensure env vars are ready


// Create Order
// POST /api/payments/create-order
router.post('/create-order', verifyToken, async (req, res) => {
    try {
        console.log("Create Order Request Body:", req.body);
        const { amount, agentId, plan } = req.body;

        // DEBUG: Check Environment Variables on Render
        const keyId = process.env.RAZORPAY_KEY_ID;
        console.log(`[DEBUG] Razorpay Key ID Configured: ${keyId ? `'${keyId.substring(0, 12)}...'` : 'MISSING'}`);
        console.log(`[DEBUG] Razorpay Key Secret Configured: ${process.env.RAZORPAY_KEY_SECRET ? 'PRESENT (Length: ' + process.env.RAZORPAY_KEY_SECRET.length + ')' : 'MISSING'}`);

        if (!amount || !agentId) {
            return res.status(400).json({ error: 'Amount and Agent ID are required' });
        }

        // Initialize Razorpay here to ensure env vars are loaded
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error("Razorpay Keys Missing in Handler:", process.env.RAZORPAY_KEY_ID ? "Key ID Present" : "Key ID Missing");
            return res.status(500).json({ error: 'Server configuration error: Razorpay keys missing' });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: amount * 100, // exact amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        console.log("Razorpay Order Created:", order);

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (err) {
        console.error('[RAZORPAY ORDER ERROR]', err);
        // Return the actual error message from Razorpay if available
        const errorMessage = err.error && err.error.description ? err.error.description : 'Failed to create payment order';
        res.status(500).json({ error: errorMessage, details: err.message });
    }
});

// Verify Payment
// POST /api/payments/verify
router.post('/verify', verifyToken, async (req, res) => {
    try {
        console.log('[PAYMENT VERIFY] Request received:', req.body);

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            agentId,
            amount,
            plan
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            console.error('[PAYMENT VERIFY] Missing Razorpay fields');
            return res.status(400).json({ error: 'Missing payment details' });
        }

        console.log('[PAYMENT VERIFY] User ID:', req.user.id);
        console.log('[PAYMENT VERIFY] Agent ID:', agentId);

        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const secret = process.env.RAZORPAY_KEY_SECRET;

        if (!secret) {
            console.error('[PAYMENT VERIFY] RAZORPAY_KEY_SECRET is missing in env');
            return res.status(500).json({ error: 'Server configuration error: payment secret missing' });
        }

        const expectedSign = crypto
            .createHmac("sha256", secret)
            .update(sign.toString())
            .digest("hex");

        console.log('[PAYMENT VERIFY] Expected Sign:', expectedSign);
        console.log('[PAYMENT VERIFY] Received Sign:', razorpay_signature);
        console.log('[PAYMENT VERIFY] Signature match:', razorpay_signature === expectedSign);

        if (razorpay_signature === expectedSign) {
            // Payment successful
            console.log('[PAYMENT VERIFY] Signature verified successfully');

            // 1. Fetch Agent to find Vendor
            const agent = await Agent.findById(agentId);
            if (!agent) {
                console.error('[PAYMENT VERIFY] Agent not found:', agentId);
                return res.status(404).json({ error: 'Agent not found' });
            }
            console.log('[PAYMENT VERIFY] Agent found:', agent.agentName);

            // 2. Create Transaction Record
            // Handle missing owner (default to buyer or a system ID if owner is not set)
            const vendorId = agent.owner || req.user.id;

            const transactionData = {
                transactionId: razorpay_payment_id,
                buyerId: req.user.id,
                vendorId: vendorId,
                agentId: agentId,
                amount: Number(amount),
                platformFee: Number(amount) * 0.5, // 50% commission
                netAmount: Number(amount) * 0.5,
                status: 'Success',
            };

            console.log('[PAYMENT VERIFY] Creating transaction with data:', transactionData);

            const transaction = new Transaction(transactionData);
            await transaction.save();
            console.log('[PAYMENT VERIFY] Transaction saved:', transaction._id);

            // 3. Add Agent to User
            console.log('[PAYMENT VERIFY] Adding agent to user update start...');
            console.log('[PAYMENT VERIFY] Target User ID:', req.user?.id);
            console.log('[PAYMENT VERIFY] Target Agent ID:', agentId);

            if (!req.user || !req.user.id) {
                console.error('[PAYMENT VERIFY] No user ID in token');
                return res.status(401).json({ error: 'User identification failed from token' });
            }

            const userDoc = await User.findById(req.user.id);
            if (!userDoc) {
                console.error('[PAYMENT VERIFY] User not found in DB with ID:', req.user.id);
                return res.json({
                    message: "Payment verified but user profile not found. Please contact support.",
                    success: true,
                    warning: "User profile link failed"
                });
            }

            console.log('[PAYMENT VERIFY] Current user agents before:', userDoc.agents);

            // Standardize agent ID comparison
            const alreadyHasAgent = userDoc.agents.some(id => id && id.toString() === agentId.toString());

            if (!alreadyHasAgent) {
                userDoc.agents.push(agentId);
                await userDoc.save();
                console.log('[PAYMENT VERIFY] Agent added successfully. New count:', userDoc.agents.length);
            } else {
                console.log('[PAYMENT VERIFY] User already had this agent. No update needed.');
            }

            return res.json({
                message: "Payment verified successfully",
                success: true,
                agentCount: userDoc.agents.length,
                userId: userDoc._id
            });
        } else {
            console.error('[PAYMENT VERIFY] Invalid signature');
            return res.status(400).json({ error: "Invalid payment signature", success: false });
        }
    } catch (err) {
        console.error('[RAZORPAY VERIFY ERROR]', err);
        res.status(500).json({
            error: 'Failed to verify payment',
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

export default router;
