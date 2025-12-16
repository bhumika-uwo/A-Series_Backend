import express from 'express'
import agentModel from '../models/Agents.js'
import userModel from "../models/User.js"
const route = express.Router()

//get all agents
route.get("/", async (req, res) => {
  const agents = await agentModel.find()
  res.status(200).json(agents)
})

//create agents
route.post('/', async (req, res) => {
  try {
    const { agentName, description, category, avatar, url } = req.body;
    const newAgent = new agentModel({
      agentName,
      description,
      category,
      avatar,
      url
    });
    const savedAgent = await newAgent.save();
    res.status(201).json(savedAgent);
  } catch (err) {
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
    if (!user.agents.includes(agentId)) {
      user.agents.push(agentId);
    } else {
      return res.status(400).json({ error: "Agent already owned" });
    }

    await user.save();

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

export default rout