
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName) {
    console.log(`Testing ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello");
        console.log(`✅ ${modelName} SUCCESS:`, result.response.text());
    } catch (err) {
        console.log(`❌ ${modelName} FAILED:`, err.message.substring(0, 150));
    }
}

async function run() {
    await testModel("gemini-2.0-flash-exp");
    await testModel("gemini-2.0-flash-lite-preview-02-05");
    await testModel("gemini-flash-latest");
}

run();
