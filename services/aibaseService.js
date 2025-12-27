import { generativeModel } from '../config/gemini.js';
import AibaseKnowledge from '../models/AibaseKnowledge.js';

// Initialize Gemini Chat Model using existing config
const model = generativeModel;

// Simple in-memory document store
let documentStore = [];

// Helper: Split text into chunks
const splitText = (text, chunkSize = 1500, overlap = 300) => {
    if (!text) return [];
    if (text.length <= chunkSize) return [text];

    const chunks = [];
    let start = 0;
    while (start < text.length) {
        const end = Math.min(start + chunkSize, text.length);
        chunks.push(text.slice(start, end));

        if (end >= text.length) break;

        // Advance start by chunkSize - overlap
        const nextStart = end - overlap;

        // Safety: If for some reason we aren't advancing, break
        if (nextStart <= start) {
            start = end; // Force advance
        } else {
            start = nextStart;
        }
    }
    return chunks;
};


// Store document
export const storeDocument = async (text) => {
    try {
        const chunks = splitText(text);
        console.log(`[AIBASE] Split into ${chunks.length} chunks.`);

        // Store chunks in memory
        chunks.forEach(chunk => {
            documentStore.push({
                content: chunk,
                timestamp: Date.now()
            });
        });

        console.log(`[AIBASE] Total documents in store: ${documentStore.length}`);
        return true;
    } catch (error) {
        console.error(`[AIBASE] Store Document Error: ${error.message}`);
        return false;
    }
};

// Simple keyword-based search
const searchDocuments = (query, topK = 5) => {
    if (!documentStore || documentStore.length === 0) return [];

    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) return documentStore.slice(-topK); // Return recent if query is too short

    const scored = documentStore.map(doc => {
        const content = doc.content.toLowerCase();
        let score = 0;
        queryWords.forEach(word => {
            if (content.includes(word)) score++;
        });
        return { ...doc, score };
    });

    return scored
        .filter(doc => doc.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
};

// RAG Chat
export const chat = async (message) => {
    try {
        if (!message || typeof message !== 'string') {
            message = String(message || "");
        }

        // Search for relevant documents
        let retrievedDocs = searchDocuments(message, 5);

        // Fallback: If no matches but we have documents, take the most recent ones
        if (retrievedDocs.length === 0 && documentStore.length > 0) {
            console.log(`[AIBASE] No keyword matches. Using most recent docs as context.`);
            retrievedDocs = documentStore.slice(-3);
        }

        // Format context
        let contextText = "";
        if (retrievedDocs && retrievedDocs.length > 0) {
            contextText = retrievedDocs
                .map(doc => doc.content)
                .join("\n\n---\n\n");
            console.log(`[AIBASE] Using ${retrievedDocs.length} chunks as context.`);
        } else {
            console.log(`[AIBASE] No documents available for context.`);
            contextText = "No uploaded documents found.";
        }

        // Create prompt
        const prompt = `
        You are the AI-Base Knowledge Assistant.
        
        USER QUESTION: ${message}

        <context>
        ${contextText}
        </context>

        INSTRUCTIONS:
        1. Search the <context> for information relevant to the user's question.
        2. If you find the answer in the <context>, provide a helpful and accurate response based ONLY on that information.
        3. If the <context> is "No uploaded documents found." or doesn't contain the answer, say: 
           "I couldn't find specific information about this in your documents, but based on what I know..." 
           Then proceed to answer using your general knowledge if possible.
        4. If the message is a greeting or casual talk, respond politely without mentioning the documents unless asked.
        5. Be professional, clear, and structured.
        `;

        // Invoke model (Gemini / Vertex AI)
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.candidates[0].content.parts[0].text;

        return text;

    } catch (error) {
        console.error(`[AIBASE] RAG Chat Error: ${error.message}`);

        // Fallback to direct chat
        try {
            const result = await model.generateContent(message);
            const response = await result.response;
            return response.candidates[0].content.parts[0].text;
        } catch (fallbackError) {
            return "Sorry, I encountered an error. Please try again.";
        }
    }
};

// Initialize from DB - Load existing documents
export const initializeFromDB = async () => {
    try {
        console.log("[AIBASE] Initializing from database...");
        // Limit to most recent 50 documents to prevent memory issues
        const docs = await AibaseKnowledge.find({}).sort({ createdAt: -1 }).limit(50);

        if (docs && docs.length > 0) {
            documentStore = []; // Reset
            for (const doc of docs) {
                if (!doc.content) continue;
                const chunks = splitText(doc.content);
                chunks.forEach(chunk => {
                    documentStore.push({
                        content: chunk,
                        timestamp: doc.createdAt
                    });
                });
            }
            console.log(`[AIBASE] Loaded ${docs.length} documents into ${documentStore.length} chunks.`);
        } else {
            console.log("[AIBASE] No documents found in database.");
        }
    } catch (error) {
        console.error(`[AIBASE] Failed to initialize from DB: ${error.message}`);
    }
};


// Reload (clear documents)
export const reloadVectorStore = async () => {
    documentStore = [];
    await initializeFromDB(); // Reload from DB instead of just clearing
    console.log("[AIBASE] Document store reloaded from database.");
};

