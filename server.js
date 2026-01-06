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
import userRoute from './routes/user.js'

import chatRoute from './routes/chat.routes.js';
import knowledgeRoute from './routes/knowledge.routes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import aibizRoutes from './routes/aibizRoutes.js';
// import fileUpload from 'express-fileupload';
import * as aibaseService from './services/aibaseService.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import revenueRoutes from './routes/revenueRoutes.js';
import supportRoutes from './routes/supportRoutes.js';


dotenv.config();
const app = express();
const PORT = process.env.PORT
// Connect to Database
connectDB().then(() => {
  console.log("Database connected, initializing services...");
  aibaseService.initializeFromDB();
});


// Middleware

app.use(cors());
app.use(cookieParser())
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
// app.use(fileUpload()); // Removed to avoid conflict with Multer (New AIBASE)

app.get("/ping-top", (req, res) => {
  res.send("Top ping works");
})

app.get("/", (req, res) => {
  res.send("All working")
})
// Debug middleware
app.use('/api', (req, res, next) => {
  console.log(`[API DEBUG] ${req.method} ${req.url}`);
  next();
});

// Mount Routes
// AIBASE Routes: /api/aibase/chat, /api/aibase/knowledge


// AIBASE Routes: /api/aibase/chat, /api/aibase/knowledge
app.use('/api/aibase/chat', chatRoute);
app.use('/api/aibase/knowledge', knowledgeRoute);

//Get user Route
app.use('/api/user', userRoute)

// Chat Routes: /api/chat (GET sessions), /api/chat/:id (GET history), /api/chat/:id/message (POST message)
app.use('/api/chat', chatRoutes);

// Auth Routes: /api/auth/login, /api/auth/signup
app.use('/api/auth', authRoutes);

// Agent Routes: /api/agents (GET/POST agents)
app.use('/api/agents', agentRoutes);

//email varification route 
app.use("/api/email_varification", emailVatifiation)

// Dashboard/General Routes: /api/dashboard/stats, /api/automations, /api/admin/settings
app.use('/api', dashboardRoutes);

// PDF Analysis Routes: /api/pdf/analyze
app.use('/api/pdf', pdfRoutes);

// AIBIZ Routes
app.use('/api/aibiz', aibizRoutes);

// Report Routes
app.use('/api/reports', reportRoutes);

// Notification Routes
app.use('/api/notifications', notificationRoutes);

// Revenue Routes
app.use('/api/revenue', revenueRoutes);

// Support Routes
app.use('/api/support', supportRoutes);


// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`AI-Mall Backend running on  http://localhost:${PORT}`);
});