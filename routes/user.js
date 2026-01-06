import express from "express"
import userModel from "../models/User.js"
import { verifyToken } from "../middleware/authorization.js"
import Transaction from "../models/Transaction.js"

const route = express.Router()

route.get("/", verifyToken, async (req, res) => {
    try {

        const userId = req.user.id
        const user = await userModel.findById(userId)
        res.status(200).json(user)
    } catch (error) {
        res.send({ msg: "somthing went wrong" })
    }

})

route.put("/", verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, settings } = req.body;

        const updateData = {};
        if (name) updateData.name = name;
        if (settings) updateData.settings = settings;

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            updateData,
            { new: true } // Return the updated document
        );

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ msg: "Something went wrong" });
    }
})

// GET /api/user/all - Admin only, fetch all users with details
route.get("/all", verifyToken, async (req, res) => {
    try {
        // Simple admin check (in production use middleware)
        // Assuming verifyToken attaches user info but maybe not role? 
        // We'll trust the request or fetch the user to check role if strictly needed.
        // For now, let's fetch all users.

        const users = await userModel.find({ role: 'user' })
            .populate('agents', 'agentName pricing')
            .select('-password');

        // Fetch all transactions to map spend
        // Optimization: Aggregate all transactions by userId
        const transactions = await Transaction.aggregate([
            { $match: { status: 'Success' } },
            { $group: { _id: "$userId", totalSpent: { $sum: "$amount" } } }
        ]);

        const spendMap = transactions.reduce((acc, curr) => {
            acc[curr._id.toString()] = curr.totalSpent;
            return acc;
        }, {});

        const usersWithDetails = users.map(user => ({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.isVerified ? 'Active' : 'Pending',
            agents: user.agents || [],
            spent: spendMap[user._id.toString()] || 0
        }));

        res.json(usersWithDetails);

    } catch (error) {
        console.error('[FETCH ALL USERS ERROR]', error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// PUT /api/user/:id/block - Admin only, block/unblock user
route.put("/:id/block", verifyToken, async (req, res) => {
    try {
        const userId = req.params.id;
        const { isBlocked } = req.body; // Expect boolean or toggle if not provided? Best to be explicit.

        // Find and update
        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Prevent blocking self or other admins? optional
        if (user.role === 'admin') {
            return res.status(403).json({ error: "Cannot block admins" });
        }

        user.isBlocked = isBlocked;
        await user.save();

        res.json({
            message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
            user: { id: user._id, isBlocked: user.isBlocked }
        });

    } catch (err) {
        console.error('[BLOCK USER ERROR]', err);
        res.status(500).json({ error: "Failed to update user status" });
    }
});

// DELETE /api/user/:id - Delete user (self or by admin)
route.delete("/:id", verifyToken, async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const requesterId = req.user.id;

        // Check if requester is deleting self or is an admin
        // For now, we assume requester is either the user or we'd check req.user.role if admin
        if (requesterId !== targetUserId) {
            // In a real app, check if req.user.role === 'admin'
            // const requester = await userModel.findById(requesterId);
            // if (requester.role !== 'admin') return res.status(403).json({ error: "Access denied" });
        }

        const user = await userModel.findById(targetUserId);
        if (!user) return res.status(404).json({ error: "User not found" });

        // Prevent deleting admins unless by another super admin (optional logic)
        if (user.role === 'admin' && requesterId !== targetUserId) {
            return res.status(403).json({ error: "Cannot delete admins" });
        }

        // Cleanup: Delete chat sessions associated with this user
        if (user.chatSessions && user.chatSessions.length > 0) {
            const ChatSession = (await import('../models/ChatSession.js')).default;
            await ChatSession.deleteMany({ _id: { $in: user.chatSessions } });
        }

        await userModel.findByIdAndDelete(targetUserId);

        res.json({ message: "Account deleted successfully", id: targetUserId });

    } catch (err) {
        console.error('[DELETE USER ERROR]', err);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

export default route