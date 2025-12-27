import express from "express";
import { generateDocument, getHistory, deleteHistory } from "../controllers/aibizController.js";
import { verifyToken } from "../middleware/authorization.js";

const router = express.Router();

// Apply verifyToken middleware to all routes to ensure user context
// Remove verifyToken if public access is desired, but AI-Mall seems auth-based.
router.post("/", verifyToken, generateDocument);
router.get("/history", verifyToken, getHistory);
router.delete("/history/:id", verifyToken, deleteHistory);

export default router;
