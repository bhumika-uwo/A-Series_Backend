
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        fs.writeFileSync("debug_gemini.log", "Success: " + JSON.stringify(result, null, 2));
    } catch (err) {
        fs.writeFileSync("debug_gemini.log", "Error: " + err.message + "\nFull: " + JSON.stringify(err, Object.getOwnPropertyNames(err)));
    }
}

listModels();
