const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { uploadPdfToCloudinary } = require('./cloudinary');

function formatINR(amount) {
    const num = Number(amount || 0);
    return 'Rs.' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const CODE128_PATTERNS = {
    '212110': [0,1,0,1,1,0],
    '222110': [0,1,0,1,0,1,1,0],
    '221210': [0,1,1,0,1,0,1,0,1],
    '221120': [0,1,1,0,1,0,0,1,1,0],
    '323110': [0,0,1,0,1,1,1,0,1,0],
    '321210': [0,0,1,0,1,1,0,1,1,0,1],
    '312110': [0,0,1,1,0,1,0,1,1,0,1],
    '311210': [0,0,1,1,0,1,0,0,1,1,1],
    '321200': [0,0,1,1,0,1,0,0,0,1,1,1],
    '122210': [0,1,0,0,1,1,1,0,1,0],
    '121220': [0,1,0,0,1,1,0,1,1,1,0],
    '121210': [0,1,0,0,1,1,0,1,0,1,1],
    '131210': [0,1,1,0,0,0,1,0,1,0,1],
    '123100': [0,1,0,1,0,0,0,1,1,1,0,0],
    '120010': [0,1,0,1,0,0,0,0,1,0,0,1],
    '110110': [0,1,1,0,1,0,1,0,1],
    '102001': [0,1,0,0,0,0,1,1,0,1],
    '100100': [0,1,0,0,0,0,0,1,0,0,1],
    '100020': [0,1,0,0,0,0,0,1,0,1,0],
    '100010': [0,1,0,0,0,0,0,1,1,0],
    '101100': [0,1,0,1,0,0,1,0,1,0,1],
    '211010': [0,0,1,0,1,1,0,0,1,0],
    '201010': [0,0,1,1,0,0,1,0,1,0],
    '110002': [0,1,1,0,0,0,0,0,1,1,0,1],
    '110010': [0,1,1,0,0,0,0,0,1,0,1],
    '112200': [0,1,1,0,1,0,0,0,1,1,0,0],
    '101020': [0,1,0,1,0,0,0,1,0,1,0],
};

function encodeCode128(text) {
    const chars = text.split('').map(c => c.charCodeAt(0));
    let pattern = [1,0,1];
    let checksum = 104;
    
    for (let i = 0; i < chars.length; i++) {
        const code = chars[i] - 32;
        if (code < 0 || code > 95) continue;
        checksum += code * (i + 1);
        const patterns = Object.values(CODE128_PATTERNS);
        pattern = pattern.concat(patterns[code % patterns.length]);
    }
    
    const checksumCode = checksum % 103;
    const patterns = Object.values(CODE128_PATTERNS);
    pattern = pattern.concat(patterns[checksumCode]);
    pattern = pattern.concat([1,0,1]);
    
    return pattern;
}

function drawBarcode(page, x, y, width, height, barcodePattern) {
    const barWidth = width / barcodePattern.length;
    for (let i = 0; i < barcodePattern.length; i++) {
        if (barcodePattern[i] === 1) {
            page.drawRectangle({
                x: x + i * barWidth,
                y: y,
                width: barWidth,
                height: height,
                color: rgb(0, 0, 0)
            });
        }
    }
}

class CustomLabelGenerator {
    constructor() {
        this.publicDir = path.join(process.cwd(), 'public', 'labels');
        if (!fs.existsSync(this.publicDir)) {
            fs.mkdirSync(this.publicDir, { recursive: true });
        }
    }

    async generate(order, user) {
        try {
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([800, 850]);
            const { width, height } = page.getSize();

            const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
            const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

            const blue = rgb(0.0, 0.4, 0.92);
            const black = rgb(0, 0, 0);
            const lightBlue = rgb(0.85, 0.92, 1);

            const margin = 30;
            const contentWidth = width - margin * 2;
            let y = height - margin;

            const receiver = order.order_receiver_address;
            const pickup = order.order_pickup_address;
            const products = order.products || [];
            const trackingNumber = order.tracking_number || 'N/A';
            const invoiceNo = order.invoice_no || `Retail${String(order.id).slice(-6)}`;
            const orderDate = new Date(order.created_at).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            const orderTotal = formatINR(order.total_amount);
            const paymentMode = (order.payment_mode || 'N/A').toUpperCase();
            
            const weight = order.weight ? `${order.weight} kg` : 'N/A';
            const len = order.length || order.lengths || 0;
            const wid = order.width || order.breadth || 0;
            const hgt = order.height || 0;
            const dimensions = (len || wid || hgt) ? `${len}x${wid}x${hgt}` : 'N/A';

            const courierName = order.courier_name || 'N/A';

            // LEFT BORDER - light blue CHEAPSHIP vertical
            for (let i = 0; i < 23; i++) {
                const textY = height - margin - 20 - i * 32;
                if (textY > margin + 20) {
                    page.drawText('CHEAPSHIP', {
                        x: margin - 8,
                        y: textY,
                        size: 12,
                        font: fontBold,
                        color: lightBlue
                    });
                }
            }

            // RIGHT BORDER - light blue CHEAPSHIP vertical
            for (let i = 0; i < 23; i++) {
                const textY = height - margin - 20 - i * 32;
                if (textY > margin + 20) {
                    page.drawText('CHEAPSHIP', {
                        x: width - margin - 85,
                        y: textY,
                        size: 12,
                        font: fontBold,
                        color: lightBlue
                    });
                }
            }

            // === SHIP TO ===
            page.drawRectangle({
                x: margin, y: y - 100,
                width: contentWidth, height: 100,
                borderColor: black, borderWidth: 2
            });

            y -= 20;
            page.drawText('Ship To', {
                x: margin + 10, y: y,
                size: 12, font: fontBold, color: black
            });

            y -= 18;
            const shipToLines = [
                receiver?.name || '',
                receiver?.address || '',
                `${receiver?.city || ''}, ${receiver?.state || ''}, ${receiver?.country || ''}`,
                receiver?.pincode || '',
                receiver?.phone || ''
            ];
            shipToLines.forEach((line) => {
                if (line) {
                    page.drawText(line, { x: margin + 10, y: y, size: 11, font: fontRegular, color: black });
                    y -= 16;
                }
            });

            y -= 10;

            // === ORDER INFO ===
            page.drawRectangle({
                x: margin, y: y - 100,
                width: contentWidth, height: 100,
                borderColor: black, borderWidth: 2
            });

            y -= 20;
            page.drawText(`Dimensions: ${dimensions}`, { x: margin + 10, y: y, size: 11, font: fontRegular, color: black });
            page.drawText(`Payment: ${paymentMode}`, { x: margin + 10, y: y - 16, size: 11, font: fontRegular, color: black });
            page.drawText(`Order Total: ${orderTotal}`, { x: margin + 10, y: y - 32, size: 11, font: fontRegular, color: black });
            page.drawText(`Weight: ${weight}`, { x: margin + 10, y: y - 48, size: 11, font: fontRegular, color: black });

            // Right side
            page.drawText(courierName, { x: width - margin - 150, y: y, size: 12, font: fontBold, color: black });
            page.drawText(`AWB: ${trackingNumber}`, { x: width - margin - 150, y: y - 16, size: 11, font: fontBold, color: black });

            // Barcode
            y -= 60;
            let barcodePattern = [];
            try { barcodePattern = encodeCode128(trackingNumber); } catch (e) {}

            if (barcodePattern.length > 0) {
                drawBarcode(page, width - margin - 170, y, 160, 50, barcodePattern);
            }

            y -= 10;

            // === SHIPPED BY ===
            page.drawRectangle({
                x: margin, y: y - 120,
                width: contentWidth, height: 120,
                borderColor: black, borderWidth: 2
            });

            y -= 20;
            page.drawText('Shipped By', { x: margin + 10, y: y, size: 12, font: fontBold, color: black });

            const shippedByLines = [
                pickup?.name || '',
                pickup?.address || '',
                `${pickup?.city || ''}, ${pickup?.state || ''}`,
                pickup?.pincode || '',
                pickup?.phone || ''
            ];
            let shippedByY = y - 18;
            shippedByLines.forEach((line) => {
                if (line) {
                    page.drawText(line, { x: margin + 10, y: shippedByY, size: 11, font: fontRegular, color: black });
                    shippedByY -= 16;
                }
            });

            // Right side order info
            page.drawText(`Order #: ${order.id}`, { x: width - margin - 170, y: y, size: 11, font: fontBold, color: black });
            
            // Second barcode
            let orderBarcodeY = y - 70;
            if (barcodePattern.length > 0) {
                drawBarcode(page, width - margin - 170, orderBarcodeY, 160, 50, barcodePattern);
            }

            y -= 80;
            page.drawText(`Invoice No: ${invoiceNo}`, { x: width - margin - 170, y: y, size: 11, font: fontRegular, color: black });
            page.drawText(`Order Date: ${orderDate}`, { x: width - margin - 170, y: y - 16, size: 11, font: fontRegular, color: black });
            page.drawText(`GSTIN: ${user?.gst_number || 'N/A'}`, { x: width - margin - 170, y: y - 32, size: 11, font: fontRegular, color: black });

            y -= 20;

            // === TABLE ===
            const rowHeight = 25;
            const tableHeight = 30 + (products.length || 1) * rowHeight;
            page.drawRectangle({
                x: margin, y: y - tableHeight + 5,
                width: contentWidth, height: tableHeight,
                borderColor: black, borderWidth: 2
            });

            // Table header - BLACK background (like React UI)
            const colWidths = [contentWidth * 0.18, contentWidth * 0.2, contentWidth * 0.1, contentWidth * 0.17, contentWidth * 0.17, contentWidth * 0.18];
            const headers = ['Item', 'SKU', 'Qty', 'Price', 'Taxable', 'Total'];
            let headerX = margin + 2;
            
            headers.forEach((header, i) => {
                page.drawRectangle({
                    x: headerX, y: y - 25,
                    width: colWidths[i], height: 25,
                    color: black
                });
                page.drawText(header, {
                    x: headerX + 5, y: y - 8,
                    size: 10, font: fontBold, color: rgb(1,1,1)
                });
                headerX += colWidths[i];
            });

            y -= 25;

            // Table rows
            const displayProducts = products.length > 0 ? products : [{name: 'N/A', sku: 'N/A', quantity: 1, price: 0, selling_price: 0}];
            
            displayProducts.forEach((product, idx) => {
                const bgColor = idx % 2 === 0 ? rgb(0.95, 0.95, 0.95) : rgb(1,1,1);
                headerX = margin + 2;
                
                colWidths.forEach(w => {
                    page.drawRectangle({
                        x: headerX, y: y - rowHeight,
                        width: w, height: rowHeight,
                        color: bgColor, borderColor: black, borderWidth: 0.5
                    });
                    headerX += w;
                });

                const productName = product.name || product.product_name || 'N/A';
                const sku = product.sku || product.channel_sku || 'N/A';
                const qty = product.quantity || 1;
                const price = Number(product.price || product.selling_price || 0);
                const total = price * qty;

                const rowData = [
                    productName.substring(0, 12),
                    sku.substring(0, 12),
                    String(qty),
                    formatINR(price),
                    formatINR(price),
                    formatINR(total)
                ];

                headerX = margin + 2;
                rowData.forEach((data, i) => {
                    page.drawText(data, {
                        x: headerX + 5, y: y - 5,
                        size: 9, font: fontRegular, color: black
                    });
                    headerX += colWidths[i];
                });

                y -= rowHeight;
            });

            y -= 5;

            // === CHARGES ===
            page.drawRectangle({
                x: margin, y: y - 55,
                width: contentWidth, height: 55,
                borderColor: black, borderWidth: 2
            });

            const platformFee = Number(order.platform_fee || 0);
            const shippingCharge = Number(order.shipping_charge || 0);
            const discount = Number(order.discount || 0);
            const codAmount = Number(order.cod_amount || 0);
            const collectable = order.payment_mode === 'COD' ? codAmount : 0;

            y -= 22;
            page.drawText(`Platform Fee: ${formatINR(platformFee)}`, { x: margin + 10, y: y, size: 11, font: fontRegular, color: black });
            page.drawText(`Shipping Charges: ${formatINR(shippingCharge)}`, { x: margin + 10, y: y - 16, size: 11, font: fontRegular, color: black });
            page.drawText(`Discount: ${formatINR(discount)}`, { x: width - margin - 120, y: y, size: 11, font: fontRegular, color: black });
            page.drawText(`Collectable Amount: ${formatINR(collectable)}`, { x: width - margin - 180, y: y - 16, size: 11, font: fontRegular, color: black });

            y -= 60;

            // === FOOTER ===
            page.drawRectangle({
                x: margin, y: y - 45,
                width: contentWidth, height: 45,
                borderColor: black, borderWidth: 2
            });

            y -= 20;
            page.drawText('All disputes are subject to Haryana Jurisdiction only. Goods once sold will only be taken back or exchanged.', {
                x: margin + 10, y: y, size: 9, font: fontRegular, color: rgb(0.4,0.4,0.4)
            });
            y -= 16;
            page.drawText('This is an auto generated label and does not require signature.', {
                x: margin + 10, y: y, size: 9, font: fontRegular, color: rgb(0.4,0.4,0.4)
            });

            y -= 45;

            // === BRANDING - BLUE like React UI ===
            const centerX = width / 2;
            page.drawText('CHEAPSHIP', {
                x: centerX - 85, y: y,
                size: 38, font: fontBold, color: blue
            });

            y -= 28;
            page.drawText('Insta: @cheapship.in', {
                x: centerX - 60, y: y,
                size: 12, font: fontRegular, color: rgb(0.3,0.3,0.3)
            });

            y -= 16;
            page.drawText('Support: +91 9251220521', {
                x: centerX - 90, y: y,
                size: 12, font: fontRegular, color: rgb(0.3,0.3,0.3)
            });

            // Save and upload
            const pdfBytes = await pdfDoc.save();
            const orderIdStr = String(order.id);

            try {
                const uploadResult = await uploadPdfToCloudinary(Buffer.from(pdfBytes), 'cheapship/labels');
                console.log('[CustomLabel] Uploaded to Cloudinary:', uploadResult.secure_url);
                return uploadResult.secure_url;
            } catch (uploadError) {
                console.error('[CustomLabel] Cloudinary upload failed:', uploadError);
                const filename = `label_${orderIdStr}_${Date.now()}.pdf`;
                const filePath = path.join(this.publicDir, filename);
                fs.writeFileSync(filePath, pdfBytes);
                console.log('[CustomLabel] Saved locally:', filePath);
                return `/labels/${filename}`;
            }

        } catch (error) {
            console.error('[CustomLabel] Error generating label:', error);
            throw error;
        }
    }
}

module.exports = new CustomLabelGenerator();
