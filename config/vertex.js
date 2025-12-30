

import fs from "fs";
import os from "os";
import path from "path";

if (process.env.GOOGLE_CREDENTIALS_BASE64) {
  const decodedKey = Buffer.from(
    process.env.GOOGLE_CREDENTIALS_BASE64,
    "base64"
  ).toString("utf-8");

  const tempKeyPath = path.join(os.tmpdir(), "gcp-key.json");
  fs.writeFileSync(tempKeyPath, decodedKey);

  process.env.GOOGLE_APPLICATION_CREDENTIALS = tempKeyPath;
}


import {
  FunctionDeclarationSchemaType,
  HarmBlockThreshold,
  HarmCategory,
  VertexAI
} from '@google-cloud/vertexai';

const project = process.env.GCP_PROJECT_ID || process.env.PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
const location = 'us-central1';
const textModel = 'gemini-1.5-flash-001';
const visionModel = 'gemini-1.5-flash-001';

if (!project) {
    console.error("❌ Vertex AI Error: GCP_PROJECT_ID not found in environment variables.");
} else {
    console.log(`✅ Vertex AI initializing with Project ID: ${project}`);
}

export const vertexAI = new VertexAI({ project: project, location: location });

// Instantiate Gemini models
export const generativeModel = vertexAI.getGenerativeModel({
  model: textModel,
  safetySettings: [{ category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }],
  generationConfig: { maxOutputTokens: 4192 },
  systemInstruction: {
    role: 'system',
    parts: [{
      text: `You are AISA™, the internal intelligent assistant developed and trained under
Unified Web Options & Services (UWO) for the AI Mall™ ecosystem.
Development and implementation are led by Sanskar Sahu.

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
Support UWO and AI Mall™ users by delivering reliable, practical, and brand-aligned assistance.
`}]
  },
});

const generativeVisionModel = vertexAI.getGenerativeModel({
  model: visionModel,
});

const generativeModelPreview = vertexAI.preview.getGenerativeModel({
  model: textModel,
});