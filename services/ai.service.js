import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import mongoose from "mongoose";
import logger from "../utils/logger.js";
import Knowledge from "../models/Knowledge.model.js";
import { Worker } from 'worker_threads';
import path from 'path';
import groqService from './groq.service.js';

// Initialize Groq Chat Model - REMOVED (Replaced by groq.service.js)
// const model = new ChatGroq({ ... });

// Real RAG Storage (MongoDB Atlas)
let vectorStore = null;
let embeddings = null;

const initializeVectorStore = async () => {
    if (!embeddings) {
        // Keeping a local instance for CHAT queries (low latency, single embedding)
        logger.info("Initializing Local Embeddings (Xenova/all-MiniLM-L6-v2) for Chat...");
        embeddings = new HuggingFaceTransformersEmbeddings({
            modelName: "Xenova/all-MiniLM-L6-v2",
        });
    }
    if (!vectorStore) {
        if (mongoose.connection.readyState !== 1) {
            throw new Error("MongoDB not connected yet");
        }

        const collection = mongoose.connection.db.collection("knowledge_vectors");

        vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
            collection: collection,
            indexName: "default",
            textKey: "text",
            embeddingKey: "embedding",
        });
        logger.info("MongoDB Atlas Vector Store initialized.");
    }
};

// Helper: Run embedding task in worker - REMOVED

export const storeDocument = async (text, docId = null) => {
    try {
        await initializeVectorStore();

        // 1. Processing in Main Thread (Reverted Worker due to V8 Crash)
        // Note: ONNX Runtime uses its own thread pool, so this is still relatively non-blocking.

        // Split Text
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const docs = await splitter.createDocuments([text]);
        logger.info(`[RAG] Split into ${docs.length} chunks.`);

        if (docs.length === 0) {
            logger.warn("[RAG] No chunks to embed.");
            return false;
        }

        // Generate Embeddings
        const vectors = await embeddings.embedDocuments(docs.map(d => d.pageContent));
        logger.info(`[RAG] Generated ${vectors.length} vectors.`);

        // 3. Add to Atlas Vector Store
        await vectorStore.addVectors(vectors, docs);
        logger.info("[RAG] SUCCESSFULLY called vectorStore.addVectors().");

        return true;
    } catch (error) {
        logger.error(`[RAG UPLOAD ERROR] ${error.message}`);
        return false;
    }
};

export const chat = async (message, activeDocContent = null) => {
    try {
        if (!message || typeof message !== 'string') {
            message = String(message || "");
        }

        // PRIORITY 1: Chat-Uploaded Document
        if (activeDocContent && activeDocContent.length > 0) {
            logger.info("[Chat Routing] Using Active Chat Document (Priority 1). Skipping RAG.");
            return await groqService.askGroq(message, activeDocContent);
        }

        // PRIORITY 2: Company Knowledge Base (RAG)
        const docCount = await Knowledge.countDocuments();
        const hasDocs = docCount > 0;

        logger.info(`[Chat Routing] No Active Chat Doc. Checking Admin RAG. Docs in KB: ${docCount}`);

        let contextText = null;

        if (hasDocs) {
            // Attempt to retrieve context
            await initializeVectorStore();

            // Perform Similarity Search with Score
            const resultsWithScore = await vectorStore.similaritySearchWithScore(message, 4);

            console.log("========== RAG DEBUG ==========");
            console.log("User Query:", message);
            console.log("Total Documents in KB:", docCount);
            console.log("Retrieved Chunks:", resultsWithScore.length);

            resultsWithScore.forEach(([doc, score], index) => {
                console.log(`--- Chunk ${index + 1} ---`);
                console.log("Score:", score);
                console.log("Source:", doc.metadata?.source || doc.metadata?.filename || "Unknown");
                console.log("Text Preview:", doc.pageContent.slice(0, 200).replace(/\n/g, ' '));
            });
            console.log("================================");

            // Threshold for "Relevance" (0.7 = High Similarity)
            const THRESHOLD = 0.7;
            const relevantDocs = resultsWithScore.filter(([doc, score]) => {
                logger.info(`[RAG Search] Doc Score: ${score.toFixed(4)} - Content: ${doc.pageContent.substring(0, 50)}...`);
                return score >= THRESHOLD;
            });

            if (relevantDocs.length > 0) {
                contextText = relevantDocs
                    .map(([doc, _]) => doc.pageContent || "")
                    .join("\n\n");
                logger.info(`[RAG] Found ${relevantDocs.length} RELEVANT docs (Score >= ${THRESHOLD}).`);

                // Prepend source header
                contextText = "SOURCE: COMPANY KNOWLEDGE BASE\n\n" + contextText;

                // Answer from Company RAG
                return await groqService.askGroq(message, contextText);

            } else {
                logger.info(`[RAG] No relevant chunks found (All scores < ${THRESHOLD}). Fallback to General Knowledge.`);
            }
        }

        // PRIORITY 3: Answer from General Knowledge (Explicit No Context)
        logger.info("[Chat Routing] Answering from General Knowledge (Groq).");
        return await groqService.askGroq(message, null);

    } catch (error) {
        logger.error(`Chat Handling Error: ${error.message}`);
        return "I'm having trouble connecting to my brain right now. Please try again later.";
    }
};

// Initialize from DB (Now just a placeholder/connection check)
export const initializeFromDB = async () => {
    try {
        logger.info("Using MongoDB Atlas Vector Search. Persistence is handled natively.");
        await initializeVectorStore();
    } catch (error) {
        logger.error(`Failed to initialize Vector Store: ${error.message} `);
    }
};

export const reloadVectorStore = async () => {
    vectorStore = null;
    await initializeFromDB();
};

export const ragChat = async (message) => {
    return chat(message);
};

export default { storeDocument, chat, initializeFromDB, reloadVectorStore, ragChat };

