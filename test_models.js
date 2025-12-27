import "dotenv/config";
import { vertexAI } from "./config/vertex.js";
import fs from 'fs';

const models = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-001",
    "gemini-1.5-pro",
    "gemini-1.5-pro-001",
    "gemini-1.0-pro",
    "gemini-pro"
];

async function testModels() {
    console.log("Starting model test...");

    for (const modelName of models) {
        try {
            console.log(`Testing ${modelName}...`);
            const model = vertexAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent({
                contents: [{ role: "user", parts: [{ text: "Hello" }] }],
            });
            console.log(`✅ ${modelName} SUCCESS`);
            fs.appendFileSync('success.txt', modelName + '\n');
        } catch (err) {
            console.log(`❌ ${modelName} FAILED`);
            // console.log(err.message);
        }
    }
    console.log("Test complete.");
}

testModels().catch(console.error);
