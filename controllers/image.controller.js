import { uploadToCloudinary } from '../services/cloudinary.service.js';
import axios from 'axios';
import logger from '../utils/logger.js';
import { GoogleAuth } from 'google-auth-library';

// Helper function to generate image using Vertex AI Imagen (NOT Gemini API)
export const generateImageFromPrompt = async (prompt) => {
    try {
        console.log(`[VERTEX IMAGE] Triggered for: "${prompt}"`);

        // Verify we have GCP Project ID for Vertex AI
        if (!process.env.GCP_PROJECT_ID) {
            throw new Error("GCP_PROJECT_ID is required for Vertex AI. Please set it in your .env file.");
        }

        console.log(`[VERTEX IMAGE] Authenticating with Vertex AI...`);
        console.log(`[VERTEX IMAGE] Project ID: ${process.env.GCP_PROJECT_ID}`);
        console.log(`[VERTEX IMAGE] Using Application Default Credentials (ADC)`);

        // Use GoogleAuth for Vertex AI (this uses ADC or service account JSON)
        const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
            projectId: process.env.GCP_PROJECT_ID
        });

        const client = await auth.getClient();
        const projectId = process.env.GCP_PROJECT_ID;

        console.log(`[VERTEX IMAGE] Getting access token...`);
        const accessTokenResponse = await client.getAccessToken();
        const token = accessTokenResponse.token || accessTokenResponse;

        if (!token) {
            throw new Error("Failed to obtain access token from Google Auth. Please check your credentials.");
        }

        console.log(`[VERTEX IMAGE] Token obtained successfully`);

        // IMPORTANT: Imagen 3.0 is ONLY available in us-central1, NOT in asia-south1
        // Even though chat uses asia-south1, images MUST use us-central1
        const location = 'asia-south1';
        // Use Imagen 3.0 Generate 002 (Latest stable)
        const modelId = 'imagen-3.0-generate-002';
        const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;

        console.log(`[VERTEX IMAGE] Calling endpoint: ${endpoint.substring(0, 60)}...`);

        const response = await axios.post(
            endpoint,
            {
                instances: [{ prompt: prompt }],
                parameters: {
                    sampleCount: 1,
                    aspectRatio: "1:1",
                    safetyFilterLevel: "block_none",
                    personGeneration: "allow_all"
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        if (response.data && response.data.predictions && response.data.predictions[0]) {
            const prediction = response.data.predictions[0];
            const base64Data = prediction.bytesBase64Encoded || (typeof prediction === 'string' ? prediction : null);

            if (base64Data) {
                console.log(`[VERTEX IMAGE] Image received successfully. Size: ${base64Data.length}`);
                const buffer = Buffer.from(base64Data, 'base64');
                const cloudResult = await uploadToCloudinary(buffer, {
                    folder: 'generated_images',
                    public_id: `gen_${Date.now()}`
                });
                return cloudResult.secure_url;
            }
        }

        throw new Error('Vertex AI response format unexpected or empty.');

    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message || "Unknown error";
        console.error(`[VERTEX IMAGE ERROR] ${errorMsg}`);
        console.error(`[VERTEX IMAGE ERROR] Full error:`, error.response?.data || error);

        // Return detailed error instead of falling back to Pollinations
        throw new Error(`Vertex AI Image Generation failed: ${errorMsg}`);
    }
};

// @desc    Generate Image
// @route   POST /api/image/generate
// @access  Public
export const generateImage = async (req, res, next) => {
    try {
        const { prompt } = req.body || {};

        if (!prompt) {
            return res.status(400).json({ success: false, message: 'Prompt is required' });
        }

        if (logger && logger.info) logger.info(`[Image Generation] Processing: "${prompt}"`);
        else console.log(`[Image Generation] Processing: "${prompt}"`);

        const imageUrl = await generateImageFromPrompt(prompt);

        if (!imageUrl) {
            throw new Error("Failed to retrieve image URL from any source.");
        }

        res.status(200).json({
            success: true,
            data: imageUrl
        });
    } catch (error) {
        if (logger && logger.error) logger.error(`[Image Generation] Critical Error: ${error.message}`);
        else console.error(`[Image Generation] Critical Error`, error);

        res.status(500).json({
            success: false,
            message: `Image generation failed: ${error.message}`
        });
    }
};

