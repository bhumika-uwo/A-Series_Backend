import mongoose from "mongoose";
import express from "express"
import ChatSession from "../models/ChatSession.js"
import { generativeModel } from "../config/gemini.js";
import userModel from "../models/User.js";
import { verifyToken } from "../middleware/authorization.js";
import { uploadToCloudinary } from "../services/cloudinary.service.js";






const router = express.Router();
// Get all chat sessions (summary)
router.post("/", async (req, res) => {
  const { content, history, systemInstruction, image, document } = req.body;

  try {
    // Construct parts from history + current message
    let parts = [];

    // Add system instruction if provided (as a user message with high priority or just prepend)
    // Note: Vertex AI "generateContent" usually takes systemInstruction in config, but for per-request
    // dynamic behavior with a static model instance, we can prepend it to the prompt.
    if (systemInstruction) {
      parts.push({ text: `System Instruction: ${systemInstruction}` });
    }

    // Add conversation history if available
    if (history && Array.isArray(history)) {
      history.forEach(msg => {
        parts.push({ text: `${msg.role === 'user' ? 'User' : 'Model'}: ${msg.content}` });
      });
    }

    // Add current message
    parts.push({ text: `User: ${content}` });

    // Handle Image Attachment
    // 'image' is already destructured from req.body above
    if (image && image.mimeType && image.base64Data) {
      parts.push({
        inlineData: {
          mimeType: image.mimeType,
          data: image.base64Data
        }
      });
    }

    // Handle Document Attachment (PDF)
    if (document && document.base64Data) {
      parts.push({
        inlineData: {
          data: document.base64Data,
          mimeType: 'application/pdf'
        }
      });
    }


    // For Google Generative AI SDK, we pass the parts directly (or a prompt string) as the "contents".
    // It accepts an array of Content objects, or a simple string/array of parts.
    // However, since we are sending a single turn of "user" content (that includes history context manually mocked), we just send the parts array wrapped in strict format if needed, or just the parts.

    // Correct usage for single-turn content generation with this SDK
    // model.generateContentStream([ ...parts ])

    // Construct valid Content object
    const contentPayload = { role: "user", parts: parts };

    console.log("--- Gemini Payload ---");
    console.log(JSON.stringify(contentPayload, null, 2).substring(0, 1000) + "...");

    let reply = "";
    let retryCount = 0;
    const maxRetries = 3;

    const attemptGeneration = async () => {
      const streamingResult = await generativeModel.generateContentStream({ contents: [contentPayload] });
      const response = await streamingResult.response;
      console.log("--- Gemini Response ---");
      console.log(JSON.stringify(response, null, 2));
      return response.text();
    };

    while (retryCount < maxRetries) {
      try {
        reply = await attemptGeneration();
        break; // Success!
      } catch (err) {
        if (err.status === 429 && retryCount < maxRetries - 1) {
          retryCount++;
          const waitTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
          console.log(`Quota reached. Retrying in ${waitTime}ms... (Attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        console.error("Gemini Response Error:", err);
        // If we have candidates, try to extract helpful error info
        if (err.response?.candidates && err.response.candidates.length > 0) {
          const candidate = err.response.candidates[0];
          reply = `[Blocked: ${candidate.finishReason}] ${candidate.safetyRatings?.map(r => `${r.category}:${r.probability}`).join(', ')}`;
        } else {
          throw err; // Re-throw if not a 429 or final attempt
        }
        break;
      }
    }

    if (!reply) {
      reply = "I understood your request but couldn't generate a text response.";
    }

    return res.status(200).json({ reply });
  } catch (err) {
    const fs = await import('fs');
    try {
      const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      const logData = `
Timestamp: ${new Date().toISOString()}
Error: ${err.message}
Code: ${err.code}
Env Project: ${process.env.GCP_PROJECT_ID}
Env Creds Path: '${credPath}'
Creds File Exists: ${credPath ? fs.existsSync(credPath) : 'N/A'}
Stack: ${err.stack}
-------------------------------------------
`;
      fs.appendFileSync('error.log', logData);
    } catch (e) { console.error("Log error:", e); }

    console.error("AISA backend error details:", {
      message: err.message,
      stack: err.stack,
      code: err.code,
      details: err.details || err.response?.data
    });
    const statusCode = err.status || 500;
    return res.status(statusCode).json({ error: "AI failed to respond", details: err.message });
  }
});
// Get all chat sessions (summary) for the authenticated user
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userModel.findById(userId).populate({
      path: 'chatSessions',
      select: 'sessionId title lastModified',
      options: { sort: { lastModified: -1 } }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.chatSessions || []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get chat history for a specific session
router.get('/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    // Optional: Verify that the session belongs to this user
    // For now, finding by sessionId is okay as sessionIds are unique/random
    let session = await ChatSession.findOne({ sessionId });

    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// Create or Update message in session
router.post('/:sessionId/message', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, title } = req.body;
    const userId = req.user.id


    if (!message?.role || !message?.content) {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    // Cloudinary Upload Logic for Attachments (Base64 -> Cloud URL)
    // We must do this BEFORE saving to MongoDB to prevent big payloads in DB
    if (message.attachment && message.attachment.url && message.attachment.url.startsWith('data:')) {
      try {
        const matches = message.attachment.url.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');

          // Upload to Cloudinary
          const uploadResult = await uploadToCloudinary(buffer, {
            resource_type: 'auto',
            folder: 'chat_attachments',
            public_id: `chat_${sessionId}_${Date.now()}`
          });

          // Update message with Cloudinary URL
          message.attachment.url = uploadResult.secure_url;
        }
      } catch (uploadError) {
        console.error("Cloudinary upload failed, falling back to Base64 storage:", uploadError);
      }
    }

    const session = await ChatSession.findOneAndUpdate(
      { sessionId },
      {
        $push: { messages: message },
        $set: { lastModified: Date.now(), ...(title && { title }) }
      },
      { new: true, upsert: true }
    );

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid userId' });
    }

    await userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { chatSessions: session._id } },
      { new: true }
    );
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});


router.delete('/:sessionId', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.id;

    const session = await ChatSession.findOneAndDelete({ sessionId });
    if (session) {
      await userModel.findByIdAndUpdate(userId, { $pull: { chatSessions: session._id } });
    }
    res.json({ message: 'History cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
