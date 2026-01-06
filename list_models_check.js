import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function listModels() {
    try {
        const result = await genAI.listModels();
        result.models.forEach((m) => {
            console.log(m.name);
        });
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
