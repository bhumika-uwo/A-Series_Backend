import axios from 'axios';

const API_URL = "http://localhost:5000/api/chat";

async function testChat() {
    console.log("Testing Chat Endpoint:", API_URL);
    try {
        const response = await axios.post(API_URL, {
            content: "Hello, are you operational?",
            history: []
        });
        console.log("Response:", response.data);
    } catch (error) {
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Error Message:", error.message);
        }
    }
}

testChat();
