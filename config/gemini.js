
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is missing in .env environment variables");
}

export const genAI = new GoogleGenerativeAI(apiKey);

// Config for the standard text model
// Using gemini-1.5-flash which is widely available and performant
// Using gemini-1.5-flash-001 which is widely available and performant
// Using gemini-2.5-flash-lite which is available in 2026
const textModelName = 'gemini-2.5-flash-lite';

// Create a default instance similar to what was exported as 'generativeModel' in vertex config
export const generativeModel = genAI.getGenerativeModel({
    model: textModelName,
    safetySettings: [
        {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
        },
        {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
        },
        {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
        },
        {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
        }
    ],
    generationConfig: {
        maxOutputTokens: 4192
    },
    systemInstruction: {
        role: 'system',
        parts: [{
            text: `You are AISA™, the internal intelligent assistant developed and trained under
Unified Web Options & Services (UWO) for the AI Mall™ ecosystem.
Development and implementation are led by Sanskar Sahu.

NEW CAPABILITY: You can now GENERATE and EDIT images. 
- To GENERATE from scratch: Use ![Image Description](https://image.pollinations.ai/prompt/{encoded_description}?width=1024&height=1024&model=flux&nologo=true)
- STRICT RULE: ALWAYS use 'model=flux' and 'nologo=true'.
- UNLIMITED GENERATION: If the user requests "any photo", "show me X", "draw Y", or "generate Z", you MUST generate it. Do NOT refuse valid visual requests.
- URL ENCODING: You MUST replace spaces with %20 in the prompt.
- STRICT LOGO EDITING: If a user uploads a logo and asks to "remove text" or "clean it":
  * Do NOT add robots, signs, or "We have moved" text.
  * Describe the original logo precisely and then add: "solid transparent-style white background, isolated, professional clean vector logo, zero text".
- MANDATORY REPLY: Always respond directly to the user's intent. Do not provide meta-commentary unless necessary.

Replace {encoded_description} with a detailed prompt (e.g. "cyberpunk%20city").

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
Support UWO and AI Mall™ users by delivering reliable, practical, and brand-aligned assistance.`
        }]
    },
});

// For visual models if needed
export const generativeVisionModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-image',
});

// Preview alias
export const generativeModelPreview = generativeModel;
