import express, { urlencoded } from "express";
 import dotenv from "dotenv";
import 'dotenv/config';
import cors from "cors";
import connectDB from "./config/db.js";
import chatRoutes from "./routes/chatRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cookieParser from "cookie-parser";
import emailVatifiation from "./routes/emailVerification.js"
import agent from "./routes/agentRoutes.js"

 dotenv.config();
const app = express();
const PORT = process.env.PORT 
// Connect to Database
connectDB();

// Middleware

app.use(cors());
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// app.use()
app.get("/", (req, res) => {
  res.send("All working")
})
// Mount Routes
// Auth Routes: /api/auth/login, /api/auth/signup
app.use('/api/auth', authRoutes);

// Chat Routes: /api/chat (GET sessions), /api/chat/:id (GET history), /api/chat/:id/message (POST message)
app.use('/api/chat', chatRoutes);

// Dashboard/General Routes: /api/dashboard/stats, /api/automations, /api/admin/settings
app.use('/api', dashboardRoutes);

// Agent Routes: /api/agents (GET/POST agents)
app.use('/api/agents', agentRoutes);

//email varification route 
app.use("/api/email_varification", emailVatifiation)


// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`AI-Mall Backend running on  http://localhost:${PORT}`);
});