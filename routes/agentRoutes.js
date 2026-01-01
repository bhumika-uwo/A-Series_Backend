import express from 'express'
import agentModel from '../models/Agents.js'
import userModel from "../models/User.js"
import notificationModel from "../models/Notification.js"
import transactionModel from "../models/Transaction.js"
import { verifyToken } from '../middleware/authorization.js'
const route = express.Router()

//get all agents
route.get("/", async (req, res) => {
  const agents = await agentModel.find()
  res.status(200).json(agents)
})

//create agents
route.post('/', verifyToken, async (req, res) => {
  try {
    const { agentName, description, category, avatar, url, pricing } = req.body;
    const newAgent = await agentModel.create({
      agentName,
      description,
      category,
      avatar,
      url,
      url,
      pricing: { type: pricing },
      status: 'Inactive',
      reviewStatus: 'Draft',
      owner: req.user.id
    });

    // Agent created successfully
    // Note: We do NOT auto-subscribe the creator to their own app in 'agents' list.
    // The creator manages it via Vendor Dashboard.

    res.status(201).json(newAgent);
  } catch (err) {
    console.error('[AGENT CREATE ERROR]', err);
    res.status(400).json({ error: 'Failed to create agent' });
  }
});

//own agents
route.post('/buy/:id', async (req, res) => {
  try {
    const agentId = req.params.id;
    const { userId } = req.body;

    console.log("USER ID FROM BODY:", userId);

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const user = await userModel.findById(userId);

    // const index = user.agents.findIndex(agent => agent._id === agentId);

    // if (index !== -1) {
    //   // Remove the item
    //   user.agents.splice(index, 1);
    //   return res.status(200).json({
    //     message: "Agent added successfully",
    //     user
    //   });

    // }

    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }

    // Avoid duplicate agent entries
    const isOwned = user.agents.some(id => id.toString() === agentId);
    if (!isOwned) {
      user.agents.push(agentId);
    } else {
      return res.status(400).json({ error: "Agent already owned" });
    }

    await user.save();

    // Record Transaction for Revenue Tracking
    const agent = await agentModel.findById(agentId);
    if (agent && agent.owner) {
      let amount = 0;
      if (agent.pricing && typeof agent.pricing === 'object') {
        // Assuming pricing might be { type: "Free" } or { amount: 10 } or similar
        // If it's free, amount is 0.
        // If plans exist, we might need more logic, but for now safe default.
        // If generic string "Free" is in type
        if (agent.pricing.type && agent.pricing.type.toLowerCase() === 'free') {
          amount = 0;
        } else {
          // Try to find a number in type or other fields? 
          // For now, let's assume 0 unless we have a specific 'cost' field.
          // Or if pricing was a string before...
          amount = 0;
        }
      } else if (typeof agent.pricing === 'string') {
        amount = parseFloat(agent.pricing.replace(/[^0-9.]/g, '')) || 0;
      }

      const platformFee = amount * 0.5; // 50% Platform Fee
      const netAmount = amount - platformFee;

      await transactionModel.create({
        agentId: agent._id,
        vendorId: agent.owner,
        buyerId: userId,
        amount,
        platformFee,
        netAmount,
        status: 'Success'
      });
    }

    res.status(200).json({
      message: "Agent added successfully",
      user
    });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

//get My agents
route.post("/get_my_agents", async (req, res) => {
  const { userId } = req.body
  const user = await userModel.findById(userId).populate("agents")
  if (!user) {
    return res.status(404).send("User Not Found")
  }
  res.status(200).json(user)
})

// Get My Agents (Authenticated)
route.get("/me", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId).populate("agents");
    if (!user) {
      return res.status(404).json({ error: "User Not Found" });
    }
    res.status(200).json(user.agents);
  } catch (err) {
    console.error("Error fetching my agents:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- Review Workflow ---

// Get agents created by me (Vendor)
route.get('/created-by-me', verifyToken, async (req, res) => {
  try {
    const agents = await agentModel.find({ owner: req.user.id });
    res.json(agents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit for review
route.post('/submit-review/:id', verifyToken, async (req, res) => {
  try {
    const agent = await agentModel.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { reviewStatus: 'Pending Review' },
      { new: true }
    );
    if (!agent) return res.status(404).json({ error: "Agent not found" });

    // Notify Admin
    // Find an admin user (assuming role 'admin' exists)
    // In a real app, you might notify all admins or a specific group.
    const admin = await userModel.findOne({ role: 'admin' });
    if (admin) {
      await notificationModel.create({
        userId: admin._id,
        message: `New App Submission: "${agent.agentName}" by Vendor. Please review.`,
        type: 'info',
        targetId: agent._id
      });
    }

    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve (Admin)
route.post('/approve/:id', verifyToken, async (req, res) => {
  try {
    const agent = await agentModel.findByIdAndUpdate(
      req.params.id,
      { reviewStatus: 'Approved', status: 'Live', rejectionReason: '' },
      { new: true }
    );

    if (agent && agent.owner) {
      const message = req.body.message || `Your app "${agent.agentName}" has been approved and is now Live!`;
      await notificationModel.create({
        userId: agent.owner,
        message,
        type: 'success',
        targetId: agent._id
      });
    }

    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject (Admin)
route.post('/reject/:id', verifyToken, async (req, res) => {
  try {
    const { reason } = req.body;
    const agent = await agentModel.findByIdAndUpdate(
      req.params.id,
      { reviewStatus: 'Rejected', status: 'Inactive', rejectionReason: reason },
      { new: true }
    );

    if (agent && agent.owner) {
      await notificationModel.create({
        userId: agent.owner,
        message: `Your app "${agent.agentName}" was rejected. Reason: ${reason}`,
        type: 'error',
        targetId: agent._id
      });
    }

    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- General CRUD ---

route.get('/:id', async (req, res) => {
  try {
    const agent = await agentModel.findById(req.params.id);
    res.json(agent);
  } catch (err) {
    res.status(404).json({ error: "Agent not found" });
  }
});

route.put('/:id', verifyToken, async (req, res) => {
  try {
    const agent = await agentModel.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true }
    );
    res.json(agent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

route.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Soft delete: Mark as Inactive and reset reviewStatus to Draft
    const agent = await agentModel.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Inactive',
        reviewStatus: 'Draft'
      },
      { new: true }
    );

    if (!agent) {
      return res.status(404).json({ error: "Agent not found" });
    }

    res.json({ message: "Agent marked as inactive", agent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default route