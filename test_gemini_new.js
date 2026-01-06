import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

async function test() {
    try {
        const result = await model.generateContent("Hello, are you there?");
        console.log("Success:", result.response.text());
    } catch (error) {
        console.error("Test Error:", error);
    }
}
test();
