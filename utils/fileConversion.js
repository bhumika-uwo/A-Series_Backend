import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, ImageRun } from 'docx';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import PptxGenJS from 'pptxgenjs';
import officeParser from 'officeparser';
import * as XLSX from 'xlsx';
import sharp from 'sharp';

/**
 * Universal File Conversion Service for AISA
 * Supports: PDF, DOCX/DOC, PPTX/PPT, XLSX/XLS, CSV, TXT, PNG, JPG/JPEG
 */

/**
 * Detect file type from buffer if extension is missing/generic
 */
function detectFormatFromBuffer(buffer) {
    if (!buffer || buffer.length < 4) return null;

    const hex = buffer.toString('hex', 0, 8).toLowerCase();

    if (hex.startsWith('25504446')) return 'pdf'; // %PDF
    if (hex.startsWith('504b0304')) return 'docx'; // ZIP (DOCX, PPTX, XLSX)
    if (hex.startsWith('ffd8ff')) return 'jpg';     // JPEG
    if (hex.startsWith('89504e47')) return 'png';   // PNG
    if (hex.startsWith('d0cf11e0')) return 'doc';    // OLE Compound File (Legacy DOC, PPT, XLS)

    // Check for plain text (simple check)
    if (buffer[0] >= 32 && buffer[0] <= 126 && buffer[1] >= 32 && buffer[1] <= 126) return 'txt';

    return null;
}

/**
 * Sanitizes text for PDF generation using standard fonts (WinAnsi encoding)
 * Removes/replaces characters that would cause "WinAnsi cannot encode" errors
 */
function sanitizeForPdf(text) {
    if (!text) return "";
    // Replace common problematic unicode characters with ASCII equivalents
    return text
        .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, '-') // Hyphens/Dashes
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'") // Single quotes
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"') // Double quotes
        .replace(/[\u2022\u2023\u2043\u204C\u204D]/g, '*')     // Bullets
        .replace(/[^\x00-\x7F\u00A0-\u00FF]/g, '?');           // Everything else not in WinAnsi/Latin1
}

/**
 * Validate and Normalize Formats
 */
function normalizeFormat(format) {
    if (!format) return 'unknown';
    const f = format.toLowerCase().replace('.', '').trim();
    if (f === 'ppt') return 'pptx';
    if (f === 'doc') return 'docx';
    if (f === 'xls') return 'xlsx';
    if (f === 'jpg' || f === 'jpeg') return 'jpg';
    return f;
}

/**
 * Validate if conversion is supported
 */
function validateConversionRequest(source, target) {
    const s = normalizeFormat(source);
    const t = normalizeFormat(target);

    const matrix = {
        'pdf': ['docx', 'txt', 'jpg', 'pptx'],
        'docx': ['pdf', 'pptx', 'txt', 'jpg'],
        'pptx': ['pdf', 'docx', 'txt', 'jpg'],
        'xlsx': ['pdf', 'docx', 'csv', 'txt'],
        'csv': ['xlsx', 'pdf', 'docx'],
        'txt': ['pdf', 'docx', 'pptx', 'xlsx'],
        'jpg': ['pdf', 'docx', 'pptx', 'png'],
        'png': ['pdf', 'docx', 'pptx', 'jpg']
    };

    return (matrix[s] && matrix[s].includes(t)) || s === t;
}

/**
 * --- CONVERSION IMPLEMENTATIONS ---
 */

async function convertImageToPdf(imageBuffer, mimeType) {
    try {
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();

        let image;
        if (mimeType.includes('png')) {
            image = await pdfDoc.embedPng(imageBuffer);
        } else {
            image = await pdfDoc.embedJpg(imageBuffer);
        }

        const dims = image.scaleToFit(width - 40, height - 40);
        page.drawImage(image, {
            x: 20,
            y: height - dims.height - 20,
            width: dims.width,
            height: dims.height,
        });

        return Buffer.from(await pdfDoc.save());
    } catch (e) {
        throw new Error('Image to PDF failed: ' + e.message);
    }
}

async function convertCsvToXlsx(csvBuffer) {
    try {
        const workbook = XLSX.read(csvBuffer, { type: 'buffer' });
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    } catch (e) {
        throw new Error('CSV to XLSX failed: ' + e.message);
    }
}

async function convertTxtToPdf(txtBuffer) {
    try {
        const text = sanitizeForPdf(txtBuffer.toString('utf8'));
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const page = pdfDoc.addPage();
        const { width, height } = page.getSize();

        page.drawText(text.substring(0, 2000), { // Basic snippet for text
            x: 50,
            y: height - 50,
            size: 10,
            font: font,
            color: rgb(0, 0, 0),
        });

        return Buffer.from(await pdfDoc.save());
    } catch (e) {
        throw new Error('TXT to PDF failed: ' + e.message);
    }
}

/**
 * Main Conversion Router
 */
export async function convertFile(fileBuffer, sourceFormat, targetFormat) {
    let s = normalizeFormat(sourceFormat);
    let t = normalizeFormat(targetFormat);

    // Auto-detect if format is generic or missing
    if (s === 'document' || s === 'unknown' || s === 'bin' || s === 'file' || s === '') {
        const detected = detectFormatFromBuffer(fileBuffer);
        if (detected) {
            console.log(`[CONVERTER] Auto-detected source format: ${detected}`);
            s = detected;
        }
    }

    console.log(`[CONVERTER] Routing request: ${s} -> ${t}`);

    if (!validateConversionRequest(s, t)) {
        throw new Error(`Conversion from ${s} to ${t} is not supported yet.`);
    }

    // Identity conversion
    if (s === t) return fileBuffer;

    // --- Image to Image Conversions ---
    if ((s === 'png' || s === 'jpg') && (t === 'png' || t === 'jpg')) {
        try {
            if (t === 'jpg') {
                return await sharp(fileBuffer).jpeg().toBuffer();
            } else {
                return await sharp(fileBuffer).png().toBuffer();
            }
        } catch (e) {
            throw new Error(`Image conversion failed: ${e.message}`);
        }
    }

    // PDF Targets
    if (t === 'pdf') {
        if (s === 'docx') {
            const result = await mammoth.extractRawText({ buffer: fileBuffer });
            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const page = pdfDoc.addPage();
            page.drawText(sanitizeForPdf(result.value.substring(0, 5000)), { x: 50, y: 750, size: 10, font });
            return Buffer.from(await pdfDoc.save());
        }
        if (s === 'pptx') {
            const text = await officeParser.parseOfficeAsync(fileBuffer);
            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const page = pdfDoc.addPage();
            page.drawText(sanitizeForPdf(text.substring(0, 5000)), { x: 50, y: 750, size: 10, font });
            return Buffer.from(await pdfDoc.save());
        }
        if (s === 'xlsx' || s === 'csv') {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const csv = XLSX.utils.sheet_to_csv(sheet);
            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const page = pdfDoc.addPage();
            page.drawText(sanitizeForPdf(csv.substring(0, 5000)), { x: 50, y: 750, size: 8, font });
            return Buffer.from(await pdfDoc.save());
        }
        if (s === 'txt') return await convertTxtToPdf(fileBuffer);
        if (s === 'jpg' || s === 'png') return await convertImageToPdf(fileBuffer, s);
    }

    // Word Targets (DOCX)
    if (t === 'docx') {
        if (s === 'pdf') {
            const data = await pdfParse(fileBuffer);
            const doc = new Document({
                sections: [{
                    children: data.text.split('\n').filter(l => l.trim()).map(p =>
                        new Paragraph({ children: [new TextRun(sanitizeForPdf(p))] })
                    )
                }]
            });
            return await Packer.toBuffer(doc);
        }
        if (s === 'pptx') {
            const text = await officeParser.parseOfficeAsync(fileBuffer);
            const doc = new Document({ sections: [{ children: text.split('\n').map(p => new Paragraph({ children: [new TextRun(p)] })) }] });
            return await Packer.toBuffer(doc);
        }
        if (s === 'txt' || s === 'csv') {
            const text = fileBuffer.toString();
            const doc = new Document({ sections: [{ children: text.split('\n').map(p => new Paragraph({ children: [new TextRun(p)] })) }] });
            return await Packer.toBuffer(doc);
        }
        if (s === 'jpg' || s === 'png') {
            const doc = new Document({
                sections: [{
                    children: [
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: fileBuffer,
                                    transformation: { width: 400, height: 400 }
                                })
                            ]
                        })
                    ]
                }]
            });
            return await Packer.toBuffer(doc);
        }
    }

    // PPTX Targets
    if (t === 'pptx') {
        const pptx = new PptxGenJS();
        if (s === 'docx' || s === 'pdf' || s === 'txt' || s === 'csv') {
            let text = "";
            if (s === 'docx') text = (await mammoth.extractRawText({ buffer: fileBuffer })).value;
            else if (s === 'pdf') text = (await pdfParse(fileBuffer)).text;
            else text = fileBuffer.toString();

            const paragraphs = text.split('\n').filter(p => p.trim());
            const linesPerSlide = 12;

            for (let i = 0; i < paragraphs.length; i += linesPerSlide) {
                const slide = pptx.addSlide();
                const chunk = paragraphs.slice(i, i + linesPerSlide).join('\n');
                slide.addText(chunk, {
                    x: 0.5, y: 0.5, w: '90%', h: '90%',
                    fontSize: 14,
                    color: '363636',
                    valign: 'top'
                });
            }
            if (paragraphs.length === 0) {
                pptx.addSlide().addText("No text content found.", { x: 0.5, y: 0.5, w: '90%', h: '10%' });
            }
        } else if (s === 'jpg' || s === 'png') {
            const slide = pptx.addSlide();
            const base64Image = fileBuffer.toString('base64');
            slide.addImage({
                data: `data:image/${s};base64,${base64Image}`,
                x: 0.5, y: 0.5, w: '90%', h: '90%'
            });
        }
        const buf = await pptx.write('nodebuffer');
        return Buffer.from(buf);
    }

    // Spreadsheet Targets
    if (t === 'xlsx') {
        if (s === 'csv') return await convertCsvToXlsx(fileBuffer);
        if (s === 'txt') {
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(fileBuffer.toString().split('\n').map(l => [l]));
            XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
            return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        }
    }

    throw new Error('This specific conversion path is not fully implemented.');
}

export { validateConversionRequest };
