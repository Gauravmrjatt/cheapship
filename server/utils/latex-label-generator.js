const fs = require('fs');
const path = require('path');
const bwipjs = require('bwip-js');
const QRCode = require('qrcode');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const { uploadPdfToCloudinary } = require('./cloudinary');

class LatexLabelGenerator {
    constructor() {
        this.templatesDir = path.join(__dirname, '..', 'templates');
        this.labelsDir = path.join(__dirname, '..', '..', 'public', 'labels');
        this.tempDir = path.join(__dirname, '..', '..', 'temp');

        [this.labelsDir, this.tempDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    formatINR(amount) {
        const num = Number(amount || 0);
        return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    formatDate(date) {
        if (!date) return 'N/A';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    escapeLatex(text) {
        if (!text) return '';
        return String(text)
            .replace(/\\/g, '\\textbackslash{}')
            .replace(/&/g, '\\&')
            .replace(/%/g, '\\%')
            .replace(/\$/g, '\\$')
            .replace(/#/g, '\\#')
            .replace(/_/g, '\\_')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}')
            .replace(/~/g, '\\textasciitilde{}')
            .replace(/\^/g, '\\textasciicircum{}');
    }

    generateBarcode(text, outputPath) {
        return new Promise((resolve, reject) => {
            try {
                bwipjs.toBuffer({
                    bcid: 'code128',
                    text: text,
                    scale: 3,
                    height: 10,
                    includetext: false,
                    textxalign: 'center'
                }, function (err, png) {
                    if (err) {
                        resolve(null);
                    } else {
                        fs.writeFileSync(outputPath, png);
                        resolve(outputPath);
                    }
                });
            } catch (error) {
                resolve(null);
            }
        });
    }

    generateQR(text, outputPath) {
        return new Promise(async (resolve, reject) => {
            try {
                const qrBuffer = await QRCode.toBuffer(text, {
                    type: 'png',
                    width: 200,
                    margin: 1,
                    color: { dark: '#000000', light: '#FFFFFF' }
                });
                fs.writeFileSync(outputPath, qrBuffer);
                resolve(outputPath);
            } catch (error) {
                resolve(null);
            }
        });
    }

    async generateImages(order) {
        const timestamp = Date.now();
        const barcodePath = path.join(this.tempDir, `barcode_${timestamp}.png`);
        const barcodeOrderPath = path.join(this.tempDir, `barcode_order_${timestamp}.png`);
        const qrcodePath = path.join(this.tempDir, `qrcode_${timestamp}.png`);
        const qrcodePath2 = path.join(this.tempDir, `qrcode2_${timestamp}.png`);
        const awbCode = order.tracking_number || '';
        const orderCode = String(order.id);

        await Promise.all([
            awbCode ? this.generateBarcode(awbCode, barcodePath) : Promise.resolve(null),
            this.generateBarcode(orderCode, barcodeOrderPath),
            this.generateQR('https://instagram.com/cashbackwallahuniverse', qrcodePath),
            this.generateQR('https://wa.me/9251220521', qrcodePath2)
        ]);

        return { barcodePath, barcodeOrderPath, qrcodePath, qrcodePath2 };
    }

    buildProductRows(products) {
        let rows = '';

        if (!products || products.length === 0) {
            rows = 'N/A & N/A & 1 & Rs.0.00 & - & Rs.0.00 \\\\\n';
        } else {
            products.forEach((product) => {
                const name = this.escapeLatex((product.name || product.product_name || 'N/A').substring(0, 15));
                const sku = this.escapeLatex((product.sku || product.channel_sku || 'N/A').substring(0, 10));
                const qty = product.quantity || 1;
                const price = Number(product.price || product.selling_price || 0);
                const taxable = price;
                const total = price * qty;
                rows += `${name} & ${sku} & ${qty} & Rs.${this.formatINR(price)} & Rs.${this.formatINR(taxable)} & Rs.${this.formatINR(total)} \\\\\n`;
            });
        }

        return rows;
    }

    buildProductTable(products) {
        let table = '\\begin{tabular}{|l|l|l|l|l|l|l|}\\hline\n';
        table += '\\textbf{Item} & \\textbf{SKU} & \\textbf{Qty} & \\textbf{Price} & \\textbf{HSN} & \\textbf{Total} \\\\\n\\hline\n';

        if (!products || products.length === 0) {
            table += 'N/A & N/A & 1 & Rs.0.00 & & Rs.0.00 \\\\\n\\hline\n';
        } else {
            products.forEach((product) => {
                const name = this.escapeLatex((product.name || product.product_name || 'N/A').substring(0, 15));
                const sku = this.escapeLatex((product.sku || product.channel_sku || 'N/A').substring(0, 10));
                const qty = product.quantity || 1;
                const price = Number(product.price || product.selling_price || 0);
                const total = price * qty;
                table += `${name} & ${sku} & ${qty} & Rs.${this.formatINR(price)} & & Rs.${this.formatINR(total)} \\\\\n\\hline\n`;
            });
        }

        table += '\\end{tabular}';
        return table;
    }

    async generate(order, user) {
        const timestamp = Date.now();
        const orderId = order.id;

        console.log(`[LatexLabel] === START label generation for order ${orderId} ===`);
        console.log(`[LatexLabel] Order data: ${JSON.stringify({ id: orderId, total_amount: order.total_amount, products: order.products?.length })}`);

        try {
            const result = await this.generatePdfLib(order, user, timestamp);
            console.log(`[LatexLabel] === END label generation === URL: ${result}`);
            return result;
        } catch (error) {
            console.error(`[LatexLabel] === FAILED ===`, error);
            throw error;
        }
    }

    async generateLatex(order, user, timestamp) {
        const orderId = order.id;
        const receiver = order.order_receiver_address || {};
        const pickup = order.order_pickup_address || {};

        const len = order.length || order.lengths || 0;
        const wid = order.width || order.breadth || 0;
        const hgt = order.height || 0;
        const dimensions = (len || wid || hgt) ? `${len}x${wid}x${hgt}` : '1x1x1';
        const paymentMode = (order.payment_mode || 'PREPAID').toUpperCase();

        const data = {
            receiver_name: this.escapeLatex(receiver.name || ''),
            receiver_address: this.escapeLatex(receiver.address || ''),
            receiver_city: this.escapeLatex(receiver.city || ''),
            receiver_state: this.escapeLatex(receiver.state || ''),
            receiver_country: this.escapeLatex(receiver.country || 'India'),
            receiver_pincode: receiver.pincode || '',
            receiver_phone: receiver.phone || '',
            sender_name: this.escapeLatex(pickup.name || ''),
            sender_address: this.escapeLatex(pickup.address || ''),
            sender_city: this.escapeLatex(pickup.city || ''),
            sender_state: this.escapeLatex(pickup.state || ''),
            sender_pincode: pickup.pincode || '',
            sender_phone: pickup.phone || '',
            sender_email: this.escapeLatex(pickup.email || 'shiprocket.com'),
            courier_name: this.escapeLatex(order.courier_name || ''),
            awb_code: order.tracking_number || '',
            order_id: orderId,
            invoice_no: order.invoice_no || `Retail${String(orderId).slice(-6)}`,
            invoice_date: this.formatDate(order.invoice_date || order.created_at),
            order_date: this.formatDate(order.created_at),
            dimensions: dimensions,
            weight: order.weight || '0.2',
            payment_mode: paymentMode,
            total_amount: this.formatINR(order.total_amount),
            platform_fee: this.formatINR(order.platform_fee || 0),
            shipping_charge: this.formatINR(order.shipping_charge || 0),
            discount: this.formatINR(order.discount || 0),
            collectable_amount: this.formatINR(order.cod_amount || 0),
            gstin: user?.gst_number || 'N/A',
            ewaybillno: order.ewaybillno || '',
            routing_code: order.routing_code || 'NA',
            rto_routing_code: order.rto_routing_code || 'NA',
            product_rows: this.buildProductRows(order.products || [])
        };

        let templatePath = path.join(this.templatesDir, 'label-template.tex');
        let template = fs.readFileSync(templatePath, 'utf8');

        Object.keys(data).forEach(key => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            template = template.replace(regex, data[key]);
        });

        template = template.replace(/\{\{[^}]+\}\}/g, '');

        const { barcodePath, qrcodePath } = await this.generateImages(order);
        const absBarcodePath = barcodePath ? path.resolve(barcodePath) : '';
        const absQrcodePath = qrcodePath ? path.resolve(qrcodePath) : '';

        if (absBarcodePath) {
            template = template.replace('BARCODE_IMAGE', `\\includegraphics[height=1.2cm,width=3.8cm]{${absBarcodePath}}`);
        } else {
            template = template.replace('BARCODE_IMAGE', '\\rule{3.8cm}{1.2cm}');
        }

        if (absQrcodePath) {
            template = template.replace('QS_LEFT', `\\includegraphics[width=1.5cm,height=1.5cm]{${absQrcodePath}}`);
            template = template.replace('QS_RIGHT', `\\includegraphics[width=1.5cm,height=1.5cm]{${absQrcodePath}}`);
        } else {
            template = template.replace('QS_LEFT', '\\rule{1.5cm}{1.5cm}');
            template = template.replace('QS_RIGHT', '\\rule{1.5cm}{1.5cm}');
        }

        template = template.replace(/BARCODE\_PLACEHOLDER/, '').replace(/QS\_PLACEHOLDER/, '');

        if (!template.includes('\\begin{document}')) {
            template = template.replace(/\\end\{document\}/g, '');
            template = '\\begin{document}\n' + template + '\n\\end{document}';
        }

        const pdfFilename = `label_${orderId}_${timestamp}.pdf`;
        const pdfPath = path.join(this.labelsDir, pdfFilename);

        console.log('[LatexLabel] Compiling LaTeX with pdflatex...');
        await this.compileLatex(template, pdfPath);

        const pdfBuffer = fs.readFileSync(pdfPath);

        try {
            const uploadResult = await uploadPdfToCloudinary(pdfBuffer, 'cashbackwallah/labels');
            return uploadResult.secure_url;
        } catch (uploadError) {
            console.error('[LatexLabel] Cloudinary upload failed:', uploadError.message);
            return `/labels/${pdfFilename}`;
        } finally {
            [barcodePath, qrcodePath, qrcodePath2].forEach(f => {
                try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (e) { }
            });
        }
    }

    async generatePdfLib(order, user, timestamp) {
        console.log('[LatexLabel] Starting pdf-lib generation...');

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 800]);
        const { width, height } = page.getSize();

        console.log('[LatexLabel] PDF page created, dimensions:', width, height);

        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const black = rgb(0, 0, 0);
        const gray = rgb(0.5, 0.5, 0.5);
        const purple = rgb(0.4, 0.18, 0.57);
        const green = rgb(0.15, 0.83, 0.4);

        const margin = 25;
        const contentWidth = width - margin * 2;

        const padding = 10;
        const lineGap = 12;

        let y = height - margin;

        console.log('[LatexLabel] Creating boxes and content...');

        const drawBox = (boxHeight) => {
            y -= boxHeight;
            page.drawRectangle({
                x: margin,
                y: y,
                width: contentWidth,
                height: boxHeight,
                borderColor: black,
                borderWidth: 1
            });
            return y + boxHeight;
        };

        const wrapText = (text, maxChars = 45) => {
            if (!text) return [''];
            const words = text.split(' ');
            let lines = [];
            let line = '';
            for (let w of words) {
                if ((line + ' ' + w).trim().length > maxChars) {
                    lines.push(line);
                    line = w;
                } else {
                    line = (line + ' ' + w).trim();
                }
            }
            if (line) lines.push(line);
            return lines;
        };

        // =========================
        // SHIP TO
        // =========================
        let top = drawBox(110);
        let innerY = top - padding;

        const receiver = order.order_receiver_address || {};

        page.drawText('Ship To', { x: margin + 10, y: innerY, size: 10, font: fontBold });
        innerY -= lineGap + 2;

        page.drawText(receiver.name || '', { x: margin + 10, y: innerY, size: 13, font: fontBold });
        innerY -= lineGap;

        wrapText(receiver.address || '').slice(0, 3).forEach(line => {
            page.drawText(line, { x: margin + 10, y: innerY, size: 9, font: fontRegular });
            innerY -= lineGap;
        });

        page.drawText(`${receiver.city || ''}, ${receiver.state || ''}`, { x: margin + 10, y: innerY, size: 9 });
        innerY -= lineGap;

        page.drawText(receiver.pincode || '', { x: margin + 10, y: innerY, size: 9 });
        innerY -= lineGap;

        page.drawText(receiver.phone || '', { x: margin + 10, y: innerY, size: 10, font: fontBold });

        // =========================
        // SHIPMENT BOX
        // =========================
        top = drawBox(100);
        innerY = top - padding;

        const dim = `${order.length || 1}x${order.width || 1}x${order.height || 1}`;
        const paymentMode = (order.payment_mode || 'PREPAID').toUpperCase();
        const collectableAmount = paymentMode === 'COD' ? Number(order.cod_amount || 0) : 0;

        page.drawText(`Dimensions: ${dim}`, { x: margin + 10, y: innerY, size: 9 });
        page.drawText(`Payment: ${paymentMode}`, { x: margin + 10, y: innerY - 14, size: 9 });
        page.drawText(`Weight: ${order.weight || 0.2} kg`, { x: margin + 10, y: innerY - 28, size: 9 });
        page.drawText(`Collectable: Rs.${this.formatINR(collectableAmount)}`, { x: margin + 10, y: innerY - 42, size: 9, font: fontBold });

        const rightX = width - margin - 180;

        page.drawText(order.courier_name || '', {
            x: rightX,
            y: innerY,
            size: 12,
            font: fontBold
        });

        page.drawText(`AWB: ${order.tracking_number || ''}`, {
            x: rightX,
            y: innerY - 16,
            size: 10,
            font: fontBold
        });

        console.log('[LatexLabel] Generating barcode and QR codes...');
        const { barcodePath, barcodeOrderPath, qrcodePath, qrcodePath2 } = await this.generateImages(order);
        console.log('[LatexLabel] Images generated:', { barcodePath: !!barcodePath, barcodeOrderPath: !!barcodeOrderPath, qrcodePath: !!qrcodePath, qrcodePath2: !!qrcodePath2 });

        if (barcodePath && fs.existsSync(barcodePath)) {
            console.log('[LatexLabel] Embedding AWB barcode...');
            const img = await pdfDoc.embedPng(fs.readFileSync(barcodePath));
            page.drawImage(img, {
                x: rightX,
                y: innerY - 50,
                width: 150,
                height: 30
            });
        }

        if (barcodeOrderPath && fs.existsSync(barcodeOrderPath)) {
            console.log('[LatexLabel] Embedding Order ID barcode...');
            const imgOrder = await pdfDoc.embedPng(fs.readFileSync(barcodeOrderPath));
            page.drawImage(imgOrder, {
                x: width / 2 - 80,
                y: 25,
                width: 100,
                height: 25
            });
            page.drawText(`Order ID: ${order.id}`, { x: width / 2 - 40, y: 15, size: 8, font: fontRegular });
        }

        // =========================
        // SENDER + ORDER DETAILS
        // =========================
        top = drawBox(130);
        innerY = top - padding;

        const pickup = order.order_pickup_address || {};
        const leftX = margin + 10;

        page.drawText('Shipped By', { x: leftX, y: innerY, size: 10, font: fontBold });
        innerY -= lineGap;

        page.drawText(pickup.name || '', { x: leftX, y: innerY, size: 9 });
        innerY -= lineGap;

        wrapText(pickup.address || '').slice(0, 3).forEach(line => {
            page.drawText(line, { x: leftX, y: innerY, size: 9 });
            innerY -= lineGap;
        });

        page.drawText(`${pickup.city || ''}, ${pickup.state || ''}`, { x: leftX, y: innerY, size: 9 });
        innerY -= lineGap;

        page.drawText(pickup.phone || '', { x: leftX, y: innerY, size: 9 });

        const rightColX = width / 2 + 20;
        let rightY = top - padding;

        page.drawText(`Order #: ${order.id}`, { x: rightColX, y: rightY, size: 9 });
        rightY -= lineGap;

        page.drawText(`Invoice: ${order.invoice_no || ''}`, { x: rightColX, y: rightY, size: 9 });
        rightY -= lineGap;

        page.drawText(`Date: ${this.formatDate(order.created_at)}`, { x: rightColX, y: rightY, size: 9 });
        rightY -= lineGap;

        page.drawText(`GSTIN: ${user?.gst_number || 'N/A'}`, { x: rightColX, y: rightY, size: 9 });

        // =========================
        // PRODUCT TABLE
        // =========================
        const products = order.products?.length ? order.products : [{ name: 'N/A', quantity: 1, price: 0 }];
        const rowHeight = 14;
        const tableHeight = 25 + products.length * rowHeight;

        top = drawBox(tableHeight);
        innerY = top - 10;

        page.drawText('Item', { x: margin + 10, y: innerY, size: 8, font: fontBold });
        page.drawText('Qty', { x: margin + 220, y: innerY, size: 8, font: fontBold });
        page.drawText('Price', { x: margin + 280, y: innerY, size: 8, font: fontBold });

        let rowY = innerY - 12;

        products.forEach(p => {
            page.drawText((p.name || '').substring(0, 20), { x: margin + 10, y: rowY, size: 8 });
            page.drawText(String(p.quantity || 1), { x: margin + 220, y: rowY, size: 8 });
            page.drawText(`Rs.${this.formatINR(p.price || 0)}`, { x: margin + 280, y: rowY, size: 8 });
            rowY -= rowHeight;
        });

        // =========================
        // LEGAL
        // =========================
        top = drawBox(30);
        page.drawText('Auto generated label. No signature required.', {
            x: margin + 10,
            y: top - 15,
            size: 7,
            font: fontRegular,
            color: gray
        });

        // =========================
        // FOOTER (FIXED)
        // =========================
        const footerY = margin + 70;

        if (qrcodePath && fs.existsSync(qrcodePath)) {
            const qr = await pdfDoc.embedPng(fs.readFileSync(qrcodePath));
            page.drawImage(qr, { x: margin + 10, y: footerY, width: 50, height: 50 });
            page.drawText('Get Instant Cashback', { x: margin + 10, y: footerY - 8, size: 7, font: fontBold });
            page.drawText('Offers on Instagram', { x: width - margin - 60, y: footerY - 18, size: 7, font: fontBold });
        }
        
        if (qrcodePath2 && fs.existsSync(qrcodePath2)) {
            const qr2 = await pdfDoc.embedPng(fs.readFileSync(qrcodePath2));
            page.drawImage(qr2, { x: width - margin - 60, y: footerY, width: 50, height: 50 });
            page.drawText('Get Instant Cashback', { x: width - margin - 60, y: footerY - 8, size: 7, font: fontBold });
            page.drawText('Offers on WhatsApp', { x: margin + 10, y: footerY - 18, size: 7, font: fontBold });
        }

        page.drawText('CASHBACKWALLAH', {
            x: width / 2 - 110,
            y: footerY + 30,
            size: 26,
            font: fontBold,
            color: purple
        });

        page.drawText("WORLD'S MOST TRUSTED CASHBACK PLATFORM", {
            x: width / 2 - 110,
            y: footerY + 12,
            size: 8,
            color: purple
        });

        page.drawText('+91 9251220521 | +91 95096 98208', {
            x: width / 2 - 90,
            y: footerY - 5,
            size: 10,
            color: purple
        });

        // SAVE
        const pdfBytes = await pdfDoc.save();
        const filename = `label_${order.id}_${timestamp}.pdf`;
        const filePath = path.join(this.labelsDir, filename);
        fs.writeFileSync(filePath, pdfBytes);
        console.log('[LatexLabel] PDF saved to:', filePath);

        try {
            console.log('[LatexLabel] Uploading to Cloudinary...');
            const uploadResult = await uploadPdfToCloudinary(pdfBytes, 'cashbackwallah/labels');
            console.log('[LatexLabel] Upload SUCCESS, deleting local file...');

            try {
                fs.unlinkSync(filePath);
                console.log('[LatexLabel] Local file deleted');
            } catch (deleteErr) {
                console.warn('[LatexLabel] Failed to delete local file:', deleteErr.message);
            }

            return uploadResult.secure_url;
        } catch (uploadError) {
            console.error('[LatexLabel] Upload FAILED, using local fallback:', uploadError.message);
            return filePath;
        }
    }

    escapePdf(text) {
        if (!text) return '';
        return String(text).replace(/([\\${}])/g, '\\$1');
    }

    wrapText(text, maxChars) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            if ((currentLine + ' ' + word).trim().length <= maxChars) {
                currentLine = (currentLine + ' ' + word).trim();
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        });
        if (currentLine) lines.push(currentLine);
        return lines.length ? lines : [''];
    }
}

module.exports = new LatexLabelGenerator();