
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Dummy init
        // Actually the response object doesn't list models directly from a model instance.
        // Use the client/manager if available?
        // In @google/generative-ai, we can't easily list models via the class instance usually?
        // Wait, documentation says "genAI.listModels()"? No?
        // Let's check imports.
        // Ah, it's not exposed on the instance usually in this SDK version?
        // Actually, checking docs:
        // const response = await genAI.listModels(); (This exists in python, maybe not JS SDK?)
        // In JS SDK:
        // It's not straightforward in older versions.
        // But let's try a direct fetch to the REST API using the key.

        // Fallback: Fetch via fetch/axios
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const cleanUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=HIDDEN`;

        // We'll use fetch, valid in node 18+ which this likely is.
        const res = await fetch(url);
        const data = await res.json();
        console.log("Models:", data.models ? data.models.map(m => m.name).join(", ") : data);
    } catch (e) {
        console.error("Error listing models:", e.message);
    }
}

listModels();
