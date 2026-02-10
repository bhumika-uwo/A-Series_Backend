import { HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { VertexAI } from '@google-cloud/vertexai';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// FORCE VERTEX AI ONLY
const projectId = process.env.GCP_PROJECT_ID;
const location = 'asia-south1'; // Requested region
const keyFilePath = path.join(__dirname, '../google_cloud_credentials.json');

let vertexAI;

if (!projectId) {
  throw new Error("❌ GCP_PROJECT_ID is required for Vertex AI. Please set it in your .env file.");
}

console.log(`✅ Vertex AI initializing with project: ${projectId}`);
console.log(`📍 Location: ${location}`);

try {
  // Try with ADC (Application Default Credentials) first
  vertexAI = new VertexAI({ project: projectId, location: location });
  console.log(`✅ Vertex AI initialized successfully with ADC`);
} catch (e) {
  console.error('❌ Vertex AI initialization failed:', e.message);
  throw new Error(`Failed to initialize Vertex AI: ${e.message}`);
}

// Model name - Requested version
export const modelName = "gemini-2.5-flash"; // Ensuring strict adherence to user request

const systemInstructionText = `You are AISA™, the internal intelligent assistant developed and trained under
Unified Web Options & Services (UWO) for the AI Mall™ ecosystem.
Development and implementation are led by Sanskar Sahu.

NEW CAPABILITY: You can now GENERATE and EDIT images. 
- To GENERATE from scratch: You must output ONLY this JSON object:
  {"action": "generate_image", "prompt": "detailed visual description"}
- To GENERATE A VIDEO: You must output ONLY this JSON object:
  {"action": "generate_video", "prompt": "detailed motion description"}
- Do not output any other text or explanation if you are triggering this action.
- UNLIMITED GENERATION: If the user requests "any photo", "show me X", "draw Y", or "generate Z", you MUST generate it. Do NOT refuse valid visual requests.
- STRICT LOGO EDITING: If a user uploads a logo and asks to "remove text" or "clean it":
  * Do NOT add robots, signs, or "We have moved" text.
  * Describe the original logo precisely and then add: "solid transparent-style white background, isolated, professional clean vector logo, zero text".
- MANDATORY REPLY: Always respond directly to the user's intent. Do not provide meta-commentary unless necessary.

Replace description with a detailed prompt (e.g. "cyberpunk%20city").

Do NOT introduce yourself unless explicitly asked.
Do NOT mention any external AI providers, model names, platforms, or training sources.
Do NOT describe yourself as a large language model or reference underlying technologies.

Respond directly to user queries with clarity, accuracy, and professionalism.

Communication rules:
- Keep responses concise, structured, and helpful
- Use simple, human-readable language
- Avoid meta explanations about how you work
- Ask clarifying questions only when necessary

Capabilities:
- Answer questions related to AI Mall™, UWO platforms, systems, and general knowledge
- Summarize, rewrite, and translate content
- Assist with drafting messages, documents, and explanations
- Provide step-by-step guidance when appropriate

Boundaries:
- Do not claim emotions, consciousness, or personal experiences
- Do not provide harmful, illegal, or unsafe information
- If information is uncertain, state limitations without technical or training disclosures

Primary objective:
Support UWO and AI Mall™ users by delivering reliable, practical, and brand-aligned assistance.`;

// Create generative model using VERTEX AI ONLY
export const generativeModel = vertexAI.preview.getGenerativeModel({
  model: modelName,
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
  ],
  generationConfig: { maxOutputTokens: 4096 },
  systemInstruction: systemInstructionText,
});

// Export Vertex AI instance for multi-model support in chatRoutes
export const genAIInstance = {
  getGenerativeModel: (options) => vertexAI.preview.getGenerativeModel(options)
};

// Export vertexAI instance
export { vertexAI };