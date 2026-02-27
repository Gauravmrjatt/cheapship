const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const bwipjs = require('bwip-js');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

class LabelCustomizer {
    constructor() {
        this.publicDir = path.join(process.cwd(), 'public', 'labels');
        if (!fs.existsSync(this.publicDir)) {
            fs.mkdirSync(this.publicDir, { recursive: true });
        }
    }

    async customize(labelUrl, orderId) {
        try {
            // 1. Download original PDF
            const response = await fetch(labelUrl);
            const originalPdfBuffer = await response.arrayBuffer();

            // 2. Load PDF
            const pdfDoc = await PDFDocument.load(originalPdfBuffer);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];
            const { width, height } = firstPage.getSize();

            // 3. Add branding overlay
            // We'll add a white background area at the top or bottom for branding
            // Shiprocket labels usually have some empty space at the very top or bottom.
            // We'll overlay a branding strip at the bottom.

            const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

            // Branding Box at the bottom
            const margin = 10;
            const boxHeight = 50;

            firstPage.drawRectangle({
                x: margin,
                y: margin,
                width: width - (margin * 2),
                height: boxHeight,
                color: rgb(1, 1, 1), // White background
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });

            // Text Branding
            firstPage.drawText('CHEAPSHIP', {
                x: margin + 10,
                y: margin + 30,
                size: 14,
                font: font,
                color: rgb(0.14, 0.39, 0.92), // Primary Blue
            });

            firstPage.drawText('Support: +91 92511 20521', {
                x: margin + 10,
                y: margin + 15,
                size: 9,
                font: fontRegular,
                color: rgb(0.2, 0.2, 0.2),
            });

            // Social Media
            firstPage.drawText('Insta: @cheapship.in', {
                x: width - 130,
                y: margin + 30,
                size: 9,
                font: fontRegular,
                color: rgb(0.2, 0.2, 0.2),
            });

            firstPage.drawText('#AapkaShippingPartner #CheapShip', {
                x: width - 130,
                y: margin + 15,
                size: 8,
                font: fontRegular,
                color: rgb(0.5, 0.5, 0.5),
            });

            // 4. Save the modified PDF
            const pdfBytes = await pdfDoc.save();
            const filename = `label_${orderId}_${Date.now()}.pdf`;
            const filePath = path.join(this.publicDir, filename);

            fs.writeFileSync(filePath, pdfBytes);

            return `/labels/${filename}`;
        } catch (error) {
            console.error('Error in LabelCustomizer:', error);
            // Fallback to original URL if customization fails
            return labelUrl;
        }
    }
}

module.exports = new LabelCustomizer();
