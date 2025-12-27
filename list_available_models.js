
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

async function listAllModels() {
    try {
        const key = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const resp = await fetch(url);
        const data = await resp.json();

        const log = "Status: " + resp.status + "\n" + JSON.stringify(data, null, 2);
        fs.writeFileSync("models_list.log", log);
        console.log("Logged to models_list.log");

    } catch (e) {
        console.error(e);
    }
}
listAllModels();
