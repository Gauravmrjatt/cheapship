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
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];

            const { width, height } = firstPage.getSize();

            // ===============================
            // 3. REMOVE SHIPROCKET BORDERS
            // (Crop edges where branding exists)
            // ===============================
            const cropMargin = 8; // adjust 15–25 if needed

            firstPage.setCropBox(
                cropMargin,
                cropMargin,
                width - cropMargin * 2,
                height - cropMargin * 2
            );

            firstPage.setMediaBox(
                cropMargin,
                cropMargin,
                width - cropMargin * 2,
                height - cropMargin * 2
            );

            // ===============================
            // 4. Add CHEAPSHIP Branding
            // ===============================
            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

            const margin = 10;
            const boxHeight = 55;

            // White branding box
            firstPage.drawRectangle({
                x: margin,
                y: margin,
                width: width - margin * 2,
                height: boxHeight,
                color: rgb(1, 1, 1),
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });

            // Brand Name
            firstPage.drawText('CHEAPSHIP', {
                x: margin + 12,
                y: margin + 32,
                size: 16,
                font: fontBold,
                color: rgb(0.14, 0.39, 0.92),
            });

            // Support
            firstPage.drawText('Support: +91 92511 20521', {
                x: margin + 12,
                y: margin + 15,
                size: 9,
                font: fontRegular,
                color: rgb(0.2, 0.2, 0.2),
            });

            // Instagram
            firstPage.drawText('Insta: @cheapship.in', {
                x: width - 170,
                y: margin + 32,
                size: 9,
                font: fontRegular,
                color: rgb(0.2, 0.2, 0.2),
            });

            // Hashtag
            firstPage.drawText('#AapkaShippingPartner', {
                x: width - 170,
                y: margin + 15,
                size: 8,
                font: fontRegular,
                color: rgb(0.5, 0.5, 0.5),
            });

            // ===============================
            // 5. Save Modified PDF and Upload to Cloudinary
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

            // fallback to original label
            return labelUrl;
        }
    }
}

module.exports = new LabelCustomizer();