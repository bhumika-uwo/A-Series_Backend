import pdfParse from 'pdf-parse/lib/pdf-parse.js';

import { generativeModel } from '../config/vertex.js';

/**
 * Extracts text content from a PDF buffer.
 * @param {Buffer} buffer - The PDF file buffer.
 * @returns {Promise<string>} - The extracted text.
 */
export const extractTextFromBuffer = async (buffer) => {
    try {
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error('[pdfAnalysisService] Extraction Error:', error);
        throw new Error('Failed to extract text from PDF');
    }
};

/**
 * Analyzes the extracted text from a PDF based on a user query.
 * @param {string} textContent - The text extracted from the PDF.
 * @param {string} userQuery - The question or task from the user.
 * @returns {Promise<string>} - The AI generated response.
 */
export const analyzePDF = async (textContent, userQuery) => {
    try {
        if (!textContent || textContent.trim().length === 0) {
            return "The uploaded document appears to be empty or could not be read.";
        }

        // Truncate text content if it's too long for the model
        // Gemini-2.0-pro has a large context, but for safety and efficiency we might truncate
        // or prioritize parts. Here we'll take a reasonable chunk or the whole thing if it fits.
        const maxChars = 30000; // Roughly 10k tokens
        const truncatedText = textContent.length > maxChars
            ? textContent.substring(0, maxChars) + "... [Text truncated due to length]"
            : textContent;

        const prompt = `
        You are an AI document assistant for AI Mall.
        
        CONTEXT FROM UPLOADED DOCUMENT:
        ---
        ${truncatedText}
        ---
        
        USER QUESTION:
        ${userQuery}
        
        INSTRUCTIONS:
        1. Answer the user's question based ONLY on the provided document context.
        2. If the answer is not in the document, say "I couldn't find information about this in the uploaded document."
        3. Be concise, professional, and accurate.
        `;

        const result = await generativeModel.generateContent(prompt);
        const response = await result.response;
        const text = response.candidates[0].content.parts[0].text;

        return text;
    } catch (error) {
        console.error('[pdfAnalysisService] Analysis Error:', error);
        throw new Error('Failed to analyze document with AI');
    }
};
