import express from 'express';
import * as pdfAnalysisService from '../services/pdfAnalysisService.js';

const router = express.Router();

/**
 * POST /api/pdf/analyze
 * Body: { query: string }
 * Files: { file: PDF }
 */
router.post('/analyze', async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ success: false, message: 'No PDF file uploaded' });
        }

        const { query } = req.body;
        if (!query) {
            return res.status(400).json({ success: false, message: 'No query provided' });
        }

        const uploadedFile = req.files.file;

        if (uploadedFile.mimetype !== 'application/pdf') {
            return res.status(400).json({ success: false, message: 'Only PDF files are supported' });
        }

        console.log(`[pdfRoutes] Analyzing file: ${uploadedFile.name}`);

        // Extract text
        const textContent = await pdfAnalysisService.extractTextFromBuffer(uploadedFile.data);

        // Analyze with AI
        const analysis = await pdfAnalysisService.analyzePDF(textContent, query);

        res.status(200).json({
            success: true,
            data: {
                filename: uploadedFile.name,
                response: analysis
            }
        });

    } catch (error) {
        console.error('[pdfRoutes] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

export default router;
