
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const models = [
    "gemini-flash-latest",
    "gemini-2.5-flash",
    "gemini-2.0-flash-001",
    "gemini-pro-latest"
];

async function test() {
    for (const m of models) {
        console.log(`Testing ${m}...`);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Test");
            console.log(`✅ ${m} WORKS`);
        } catch (e) {
            console.log(`❌ ${m} ERROR: ${e.message.substring(0, 50)}...`);
        }
    }
}
test();
