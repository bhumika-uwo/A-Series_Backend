
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testKeys() {
    console.log("--- Testing API Keys ---");

    // 1. OpenAI
    console.log("\n1. Testing OpenAI...");
    if (!process.env.OPENAI_API_KEY) console.log("   - MISSING KEY");
    else {
        try {
            await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-4o',
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            }, { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } });
            console.log("   - SUCCESS ✅");
        } catch (e) {
            console.log(`   - FAILED ❌: ${e.response?.data?.error?.message || e.message}`);
        }
    }

    // 2. Anthropic (Claude)
    console.log("\n2. Testing Claude...");
    if (!process.env.ANTHROPIC_API_KEY) console.log("   - MISSING KEY");
    else {
        try {
            await axios.post('https://api.anthropic.com/v1/messages', {
                model: 'claude-3-opus-20240229',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Hi' }]
            }, { headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' } });
            console.log("   - SUCCESS ✅");
        } catch (e) {
            console.log(`   - FAILED ❌: ${e.response?.data?.error?.message || e.message}`);
        }
    }

    // 3. Groq
    console.log("\n3. Testing Groq...");
    if (!process.env.GROQ_API_KEY) console.log("   - MISSING KEY");
    else {
        try {
            await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: 'Hi' }],
                max_tokens: 5
            }, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } });
            console.log("   - SUCCESS ✅");
        } catch (e) {
            console.log(`   - FAILED ❌: ${e.response?.data?.error?.message || e.message}`);
        }
    }

    // 4. Kimi
    console.log("\n4. Testing Kimi...");
    if (!process.env.KIMI_API_KEY) console.log("   - MISSING KEY");
    else {
        try {
            await axios.post('https://api.moonshot.ai/v1/chat/completions', {
                model: 'moonshot-v1-8k',
                messages: [{ role: 'user', content: 'Hi' }]
            }, { headers: { Authorization: `Bearer ${process.env.KIMI_API_KEY}` } });
            console.log("   - SUCCESS ✅");
        } catch (e) {
            console.log(`   - FAILED ❌: ${e.response?.data?.error?.message || e.message}`);
        }
    }
}

testKeys();
