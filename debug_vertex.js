import 'dotenv/config';
import { generativeModel, vertexAI } from './config/vertex.js';

async function test() {
    console.log("Testing Vertex AI Configuration...");

    // Check Project ID
    const envProjectId = process.env.GCP_PROJECT_ID;
    console.log("ENV Project ID:", envProjectId);

    // Check Credentials content (safely)
    if (process.env.GOOGLE_CREDENTIALS_BASE64) {
        try {
            const decodedBuffer = Buffer.from(process.env.GOOGLE_CREDENTIALS_BASE64, 'base64');
            const keyContent = JSON.parse(decodedBuffer.toString('utf-8'));

            console.log("--- Credential Key Details ---");
            console.log("Client Email:", keyContent.client_email);
            console.log("Project ID in Key:", keyContent.project_id);
            console.log("------------------------------");

            if (keyContent.project_id !== envProjectId) {
                console.warn("WARNING: Project ID in .env does not match Project ID in credentials file!");
            }
        } catch (e) {
            console.error("Error parsing credentials:", e.message);
        }
    } else {
        console.error("GOOGLE_CREDENTIALS_BASE64 is missing!");
    }

    try {
        console.log("Generating content...");
        const result = await generativeModel.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log("Response:", response.candidates[0].content.parts[0].text);
    } catch (error) {
        console.error("Error testing Vertex AI:", error.message);
        // Print full error structure if it's an object
        // if (error.response) console.log(JSON.stringify(error.response, null, 2));
    }
}

test();
