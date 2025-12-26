import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const testPDFAnalysis = async () => {
    try {
        const filePath = process.argv[2];
        let buffer;
        let filename;

        if (filePath && fs.existsSync(filePath)) {
            console.log(`Testing with real file: ${filePath}`);
            buffer = fs.readFileSync(filePath);
            filename = path.basename(filePath);
        } else {
            console.log("No valid file path provided. Attempting to use a minimal mock buffer...");
            console.log("(Note: Mock buffers often fail with 'bad XRef entry' in pdf-parse due to strict format requirements)");

            // Minimal mock PDF content
            const pdfContent = `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << >> >>\nendobj\n4 0 obj\n<< /Length 20 >>\nstream\nBT /F1 12 Tf (Test) Tj ET\nendstream\nendobj\ntrailer\n<< /Size 5 /Root 1 0 R >>\n%%EOF`;
            buffer = Buffer.from(pdfContent);
            filename = 'mock_test.pdf';
        }

        const form = new FormData();
        form.append('file', buffer, {
            filename: filename,
            contentType: 'application/pdf',
        });
        form.append('query', 'Summarize the content of this document.');

        console.log("Sending request to http://localhost:5000/api/pdf/analyze ...");

        const response = await axios.post('http://localhost:5000/api/pdf/analyze', form, {
            headers: {
                ...form.getHeaders(),
            },
        });

        console.log("Success Response:", JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.error("Test Failed:");
        if (error.response) {
            console.error("Status:", error.response.status);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error("Message:", error.message);
        }
    }
};

testPDFAnalysis();

