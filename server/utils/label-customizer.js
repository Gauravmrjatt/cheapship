const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const { uploadPdfToCloudinary } = require('./cloudinary');

class LabelCustomizer {
    constructor() {
        this.publicDir = path.join(process.cwd(), 'public', 'labels');

        if (!fs.existsSync(this.publicDir)) {
            fs.mkdirSync(this.publicDir, { recursive: true });
        }
    }

    async customize(labelUrl, orderId) {
        try {
            // ===============================
            // 1. Download Original PDF
            // ===============================
            const response = await fetch(labelUrl);
            const originalPdfBuffer = await response.arrayBuffer();

            // ===============================
            // 2. Load PDF
            // ===============================
            const pdfDoc = await PDFDocument.load(originalPdfBuffer);
            const firstPage = pdfDoc.getPages()[0];

            const { width, height } = firstPage.getSize();

            // ===============================
            // 3. SAFE CROP (Fix right cut issue)
            // ===============================
            const cropLeft = 6;
            const cropBottom = 6;
            const cropRight = 2;   // 👈 smaller to avoid cutting barcode/text
            const cropTop = 6;

            const newWidth = width - cropLeft - cropRight;
            const newHeight = height - cropBottom - cropTop;

            firstPage.setCropBox(
                cropLeft,
                cropBottom,
                newWidth,
                newHeight
            );

            firstPage.setMediaBox(
                cropLeft,
                cropBottom,
                newWidth,
                newHeight
            );

            // ===============================
            // 4. Fonts
            // ===============================
            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

            const margin = 10;
            const boxHeight = 55;

            // ===============================
            // 5. White Branding Box
            // ===============================
            firstPage.drawRectangle({
                x: margin,
                y: margin,
                width: newWidth - margin * 2,
                height: boxHeight,
                color: rgb(1, 1, 1),
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });

            // ===============================
            // 6. Left Content
            // ===============================
            firstPage.drawText('CHEAPSHIP', {
                x: margin + 12,
                y: margin + 32,
                size: 16,
                font: fontBold,
                color: rgb(0.14, 0.39, 0.92),
            });

            firstPage.drawText('Support: +91 9251220521', {
                x: margin + 12,
                y: margin + 15,
                size: 9,
                font: fontRegular,
                color: rgb(0.2, 0.2, 0.2),
            });

            // ===============================
            // 7. RIGHT SIDE (FIXED POSITION)
            // ===============================
            const rightPadding = 160;

            firstPage.drawText('Insta: @cheapship.in', {
                x: newWidth - rightPadding,
                y: margin + 32,
                size: 9,
                font: fontRegular,
                color: rgb(0.2, 0.2, 0.2),
            });

            firstPage.drawText('#AapkaShippingPartner', {
                x: newWidth - rightPadding,
                y: margin + 15,
                size: 8,
                font: fontRegular,
                color: rgb(0.5, 0.5, 0.5),
            });

            // ===============================
            // 8. Save & Upload
            // ===============================
            const pdfBytes = await pdfDoc.save();

            try {
                const uploadResult = await uploadPdfToCloudinary(
                    Buffer.from(pdfBytes),
                    `cheapship/labels`
                );
                return uploadResult.secure_url;
            } catch (uploadError) {
                console.error('Cloudinary upload failed, saving locally:', uploadError);

                const filename = `label_${orderId}_${Date.now()}.pdf`;
                const filePath = path.join(this.publicDir, filename);

                fs.writeFileSync(filePath, pdfBytes);
                return `/labels/${filename}`;
            }

        } catch (error) {
            console.error('Label customization failed:', error);
            return labelUrl;
        }
    }
}

module.exports = new LabelCustomizer();