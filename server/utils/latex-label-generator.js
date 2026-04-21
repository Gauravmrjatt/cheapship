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
        const qrcodePath = path.join(this.tempDir, `qrcode_${timestamp}.png`);
        const awbCode = order.tracking_number || '';

        await Promise.all([
            awbCode ? this.generateBarcode(awbCode, barcodePath) : Promise.resolve(null),
            awbCode ? this.generateQR(`https://cashbackwallah.com/track/${awbCode}`, qrcodePath) : Promise.resolve(null)
        ]);

        return { barcodePath, qrcodePath };
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

        console.log(`[LatexLabel] Generating label for order ${orderId}...`);

        try {
            return await this.generatePdfLib(order, user, timestamp);
        } catch (error) {
            console.error('[LatexLabel] Error generating label:', error);
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
            [barcodePath, qrcodePath].forEach(f => {
                try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
            });
        }
    }

    async generatePdfLib(order, user, timestamp) {
        const orderId = order.id;
        const receiver = order.order_receiver_address || {};
        const pickup = order.order_pickup_address || {};

        console.log(`[LatexLabel] Using pdf-lib for order ${orderId}`);

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 800]);
        const { width, height } = page.getSize();

        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const purple = rgb(0.4, 0.18, 0.57);
        const green = rgb(0.15, 0.83, 0.4);
        const black = rgb(0, 0, 0);
        const gray = rgb(0.4, 0.4, 0.4);
        const lightBlue = rgb(0.39, 0.41, 0.94);

        const margin = 25;
        const contentWidth = width - margin * 2;
        let y = height - margin;

        y -= 35;
        page.drawRectangle({
            x: margin, y: y - 95,
            width: contentWidth, height: 95,
            borderColor: black, borderWidth: 1
        });

        y -= 15;
        page.drawText('Ship To', { x: margin + 10, y: y, size: 10, font: fontBold, color: black });
        y -= 18;
        page.drawText(this.escapePdf(receiver.name || ''), { x: margin + 10, y: y, size: 14, font: fontBold, color: black });
        y -= 18;
        const addrLines = this.wrapText(this.escapePdf(receiver.address || ''), 50);
        addrLines.slice(0, 4).forEach(line => {
            page.drawText(line, { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
            y -= 14;
        });
        page.drawText(`${this.escapePdf(receiver.city || '')}, ${this.escapePdf(receiver.state || '')}, ${receiver.country || 'India'}`, { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
        y -= 14;
        page.drawText(receiver.pincode || '', { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
        y -= 14;
        page.drawText(receiver.phone || '', { x: margin + 10, y: y, size: 10, font: fontBold, color: black });

        y -= 35;
        page.drawRectangle({
            x: margin, y: y - 100,
            width: contentWidth, height: 100,
            borderColor: black, borderWidth: 1
        });

        y -= 15;
        const dim = (order.length || order.width || order.height) ? `${order.length || 1}x${order.width || 1}x${order.height || 1}` : '1x1x1';
        const paymentMode = (order.payment_mode || 'PREPAID').toUpperCase();
        const products = order.products || [];
        const itemsTotal = products.reduce((sum, p) => sum + (Number(p.price || p.selling_price || 0) * (p.quantity || 1)), 0);

        page.drawText(`Dimensions: ${dim}`, { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
        page.drawText(`Payment: ${paymentMode}`, { x: margin + 10, y: y - 12, size: 9, font: fontRegular, color: black });
        page.drawText(`Order Total: Rs.${this.formatINR(itemsTotal)}`, { x: margin + 10, y: y - 24, size: 9, font: fontRegular, color: black });
        page.drawText(`Weight: ${order.weight || 0.2} kg`, { x: margin + 10, y: y - 36, size: 9, font: fontRegular, color: black });

        page.drawText(order.courier_name || '', { x: width - margin - 150, y: y, size: 12, font: fontBold, color: black });
        page.drawText(`AWB: ${order.tracking_number || ''}`, { x: width - margin - 150, y: y - 16, size: 10, font: fontBold, color: black });

        const { barcodePath, qrcodePath } = await this.generateImages(order);

        if (barcodePath && fs.existsSync(barcodePath)) {
            const barcodeImg = fs.readFileSync(barcodePath);
            const barcodePng = await pdfDoc.embedPng(barcodeImg);
            page.drawImage(barcodePng, {
                x: width - margin - 190,
                y: y - 52,
                width: 160,
                height: 34
            });
        }

        y -= 100;
        page.drawRectangle({
            x: margin, y: y - 120,
            width: contentWidth, height: 120,
            borderColor: black, borderWidth: 1
        });

        y -= 15;
        page.drawText('Shipped By (if undelivered, return to)', { x: margin + 10, y: y, size: 10, font: fontBold, color: black });
        y -= 16;
        page.drawText(this.escapePdf(pickup.name || ''), { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
        y -= 14;
        const pickupAddrLines = this.wrapText(this.escapePdf(pickup.address || ''), 50);
        pickupAddrLines.slice(0, 4).forEach(line => {
            page.drawText(line, { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
            y -= 14;
        });
        page.drawText(`${this.escapePdf(pickup.city || '')}, ${this.escapePdf(pickup.state || '')}`, { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
        y -= 14;
        page.drawText(pickup.pincode || '', { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
        y -= 14;
        page.drawText(pickup.phone || '', { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
        y -= 22;
        page.drawText('Customer Care: 1800-123-4567', { x: margin + 10, y: y, size: 8, font: fontRegular, color: gray });
        y -= 12;
        page.drawText(`Email: ${pickup.email || 'shiprocket.com'}`, { x: margin + 10, y: y, size: 8, font: fontRegular, color: gray });

        const rightColY = y + 80;
        page.drawText(`Order #: `, { x: width - margin - 150, y: rightColY, size: 9, font: fontRegular, color: black });
        page.drawText(`${orderId}`, { x: width - margin - 150, y: rightColY - 12, size: 9, font: fontBold, color: black });
        page.drawText(`Invoice No: `, { x: width - margin - 150, y: rightColY - 26, size: 9, font: fontRegular, color: black });
        page.drawText(`${order.invoice_no || `Retail${String(orderId).slice(-6)}`}`, { x: width - margin - 150, y: rightColY - 38, size: 9, font: fontBold, color: black });
        page.drawText(`Invoice Date: `, { x: width - margin - 150, y: rightColY - 52, size: 9, font: fontRegular, color: black });
        page.drawText(`${this.formatDate(order.invoice_date || order.created_at)}`, { x: width - margin - 150, y: rightColY - 64, size: 9, font: fontBold, color: black });
        page.drawText(`Order Date: `, { x: width - margin - 150, y: rightColY - 78, size: 9, font: fontRegular, color: black });
        page.drawText(`${this.formatDate(order.created_at)}`, { x: width - margin - 150, y: rightColY - 90, size: 9, font: fontBold, color: black });
        page.drawText(`GSTIN: `, { x: width - margin - 150, y: rightColY - 104, size: 9, font: fontRegular, color: black });
        page.drawText(`${user?.gst_number || 'N/A'}`, { x: width - margin - 150, y: rightColY - 116, size: 9, font: fontBold, color: black });

        y -= 145;
        page.drawRectangle({
            x: margin, y: y - 35,
            width: contentWidth, height: 35,
            borderColor: black, borderWidth: 1
        });

        page.drawText('Item', { x: margin + 10, y: y - 6, size: 8, font: fontBold, color: black });
        page.drawText('SKU', { x: margin + 120, y: y - 6, size: 8, font: fontBold, color: black });
        page.drawText('Qty', { x: margin + 220, y: y - 6, size: 8, font: fontBold, color: black });
        page.drawText('Price', { x: margin + 280, y: y - 6, size: 8, font: fontBold, color: black });
        page.drawText('Total', { x: margin + 380, y: y - 6, size: 8, font: fontBold, color: black });

        let productY = y - 20;
        const products = order.products || [];
        const displayProducts = products.length > 0 ? products : [{ name: 'N/A', sku: 'N/A', quantity: 1, price: 0 }];

        displayProducts.slice(0, 3).forEach((product) => {
            const name = (product.name || product.product_name || 'N/A').substring(0, 15);
            const sku = (product.sku || product.channel_sku || 'N/A').substring(0, 12);
            const qty = product.quantity || 1;
            const price = Number(product.price || product.selling_price || 0);
            const total = price * qty;

            page.drawText(name, { x: margin + 10, y: productY, size: 8, font: fontRegular, color: black });
            page.drawText(sku, { x: margin + 120, y: productY, size: 8, font: fontRegular, color: black });
            page.drawText(String(qty), { x: margin + 220, y: productY, size: 8, font: fontRegular, color: black });
            page.drawText(`Rs.${this.formatINR(price)}`, { x: margin + 280, y: productY, size: 8, font: fontRegular, color: black });
            page.drawText(`Rs.${this.formatINR(total)}`, { x: margin + 380, y: productY, size: 8, font: fontRegular, color: black });
            productY -= 14;
        });

        y -= 50;

        y -= 50;
        page.drawRectangle({
            x: margin, y: y - 25,
            width: contentWidth, height: 25,
            borderColor: black, borderWidth: 1
        });
        page.drawText('All disputes are subject to Haryana Jurisdiction only. Goods once sold will only be taken back or exchanged as per store exchange policy.', {
            x: margin + 10, y: y - 8, size: 7, font: fontRegular, color: gray
        });
        page.drawText('This is an auto generated label and does not require any signature.', {
            x: margin + 10, y: y - 18, size: 7, font: fontRegular, color: gray
        });

        y -= 30;

        const footerY = y - 70;

        if (qrcodePath && fs.existsSync(qrcodePath)) {
            const qrImg = fs.readFileSync(qrcodePath);
            const qrPng = await pdfDoc.embedPng(qrImg);
            page.drawImage(qrPng, {
                x: margin + 20,
                y: footerY - 45,
                width: 50,
                height: 50
            });
            page.drawText('Get Instant Cashback', { x: margin + 22, y: footerY - 55, size: 7, font: fontBold, color: black });
            page.drawText('Offers on WhatsApp', { x: margin + 20, y: footerY - 65, size: 7, font: fontBold, color: black });
        }

        page.drawText('CASHBACKWALLAH', {
            x: width / 2 - 90, y: footerY - 10,
            size: 24, font: fontBold, color: purple
        });
        page.drawText("WORLD'S LARGEST & MOST TRUSTED FLAT CASHBACK PLATFORM", {
            x: width / 2 - 110, y: footerY - 26,
            size: 7, font: fontRegular, color: purple
        });
        page.drawText('+91 92511 20521 | +91 95096 98208', {
            x: width / 2 - 65, y: footerY - 40,
            size: 10, font: fontRegular, color: green
        });
        page.drawText('@cashbackwallahuniverse', {
            x: width / 2 - 65, y: footerY - 54,
            size: 10, font: fontRegular, color: purple
        });

        if (qrcodePath && fs.existsSync(qrcodePath)) {
            const qrImg = fs.readFileSync(qrcodePath);
            const qrPng = await pdfDoc.embedPng(qrImg);
            page.drawImage(qrPng, {
                x: width - margin - 70,
                y: footerY - 45,
                width: 50,
                height: 50
            });
            page.drawText('Get Instant Cashback', { x: width - margin - 70, y: footerY - 55, size: 7, font: fontBold, color: black });
            page.drawText('Offers on Instagram', { x: width - margin - 70, y: footerY - 65, size: 7, font: fontBold, color: black });
        }

        const pdfBytes = await pdfDoc.save();
        const filename = `label_${orderId}_${timestamp}.pdf`;
        const pdfPath = path.join(this.labelsDir, filename);
        fs.writeFileSync(pdfPath, pdfBytes);
        console.log(`[LatexLabel] PDF written: ${pdfPath}`);

        try {
            const uploadResult = await uploadPdfToCloudinary(Buffer.from(pdfBytes), 'cashbackwallah/labels');
            return uploadResult.secure_url;
        } catch (uploadError) {
            console.error('[LatexLabel] Cloudinary upload failed:', uploadError.message);
            return `/labels/${filename}`;
        } finally {
            [barcodePath, qrcodePath].forEach(f => {
                try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (e) { }
            });
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