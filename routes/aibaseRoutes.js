import express from 'express';
import AibaseConversation from '../models/AibaseConversation.js';
import AibaseKnowledge from '../models/AibaseKnowledge.js';
import * as aibaseService from '../services/aibaseService.js';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';


const router = express.Router();

// ==================== CHAT ROUTES ====================

// GET /api/aibase/ping - Test route
router.get('/ping', (req, res) => {
    console.log('[AIBASE] Ping route hit');
    res.json({ success: true, message: 'AIBASE router is working' });
});

// POST /api/aibase/chat - Send a message
router.post('/chat', async (req, res) => {
    try {
        const { message, conversationId } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        // Get AI response using RAG
        const responseText = await aibaseService.chat(message);

        // Save to conversation
        let conversation;
        if (conversationId) {
            conversation = await AibaseConversation.findById(conversationId);
        }

        if (!conversation) {
            conversation = new AibaseConversation({
                userId: 'admin',
                title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
                messages: []
            });
        }

        conversation.messages.push({ role: 'user', text: message });
        conversation.messages.push({ role: 'assistant', text: responseText });
        conversation.lastMessageAt = Date.now();
        await conversation.save();

        res.status(200).json({
            success: true,
            data: responseText,
            conversationId: conversation._id
        });
    } catch (error) {
        console.error('[AIBASE] Chat Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/aibase/chat/history - Get conversation history
router.get('/chat/history', async (req, res) => {
    try {
        const conversations = await AibaseConversation.find({ userId: 'admin' })
            .sort({ lastMessageAt: -1 })
            .select('title lastMessageAt createdAt');

        res.status(200).json({
            success: true,
            data: conversations
        });
    } catch (error) {
        console.error('[AIBASE] Get History Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/aibase/chat/:id - Get specific conversation
router.get('/chat/:id', async (req, res) => {
    try {
        const conversation = await AibaseConversation.findById(req.params.id);
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }
        res.status(200).json({
            success: true,
            data: conversation
        });
    } catch (error) {
        console.error('[AIBASE] Get Conversation Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/aibase/chat/:id - Delete a conversation
router.delete('/chat/:id', async (req, res) => {
    try {
        const conversation = await AibaseConversation.findById(req.params.id);
        if (!conversation) {
            return res.status(404).json({ success: false, message: 'Conversation not found' });
        }

        await AibaseConversation.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Conversation deleted'
        });
    } catch (error) {
        console.error('[AIBASE] Delete Conversation Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== KNOWLEDGE ROUTES ====================

// POST /api/aibase/knowledge/upload - Upload a document
router.post('/knowledge/upload', async (req, res) => {
    try {
        if (!req.files || Object.keys(req.files).length === 0) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const uploadedFile = req.files.file;
        console.log(`[AIBASE] File uploaded: ${uploadedFile.name}`);

        let textContent = '';

        // Parse PDF
        if (uploadedFile.mimetype === 'application/pdf') {
            try {
                const data = await pdfParse(uploadedFile.data);
                textContent = data.text;
                console.log(`[AIBASE] Parsed PDF with ${data.numpages} pages`);
            } catch (pdfError) {
                console.error(`[AIBASE] PDF Parsing Failed: ${pdfError.message}`);
                textContent = "PDF parsing failed.";
            }
        } else if (uploadedFile.mimetype === 'text/plain') {
            textContent = uploadedFile.data.toString('utf8');
        } else {
            console.log('[AIBASE] Unsupported file type');
            return res.status(400).json({ success: false, message: 'Only PDF and TXT files are supported' });
        }

        // Store in vector store
        if (textContent) {
            await aibaseService.storeDocument(textContent);
            console.log("[AIBASE] Document stored in vector store");

            // Save metadata
            await AibaseKnowledge.create({
                filename: uploadedFile.name,
                content: textContent.substring(0, 5000) // Store first 5000 chars for reference
            });
        }

        res.status(200).json({
            success: true,
            message: 'File uploaded and processed successfully',
            data: {
                filename: uploadedFile.name,
                mimetype: uploadedFile.mimetype,
                size: uploadedFile.size,
                parsedTextLength: textContent.length
            }
        });
    } catch (error) {
        console.error('[AIBASE] Upload Error:', error);
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
});

// GET /api/aibase/knowledge/documents - Get all documents
router.get('/knowledge/documents', async (req, res) => {
    try {
        const documents = await AibaseKnowledge.find({}, 'filename uploadDate');
        res.status(200).json({
            success: true,
            data: documents
        });
    } catch (error) {
        console.error('[AIBASE] Get Documents Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/aibase/knowledge/:id - Delete a document
router.delete('/knowledge/:id', async (req, res) => {
    try {
        const document = await AibaseKnowledge.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        await AibaseKnowledge.findByIdAndDelete(req.params.id);

        // Reload vector store
        await aibaseService.reloadVectorStore();

        res.status(200).json({
            success: true,
            message: 'Document deleted and knowledge base updated'
        });
    } catch (error) {
        console.error('[AIBASE] Delete Document Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
