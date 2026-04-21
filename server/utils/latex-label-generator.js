const fs = require('fs');
const path = require('path');
const bwipjs = require('bwip-js');
const QRCode = require('qrcode');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const latex = require('node-latex');
const { execSync } = require('child_process');
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

    canUseLatex() {
        try {
            execSync('pdflatex --version', { stdio: 'ignore' });
            return true;
        } catch (e) {
            return false;
        }
    }

    compileLatex(texString, outputPath) {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outputPath);
            const pdf = latex(texString, { passes: 2 });

            pdf.pipe(output);

            pdf.on('error', (err) => {
                console.error('[LatexLabel] LaTeX Error:', err.message);
                reject(err);
            });

            pdf.on('finish', () => {
                resolve(outputPath);
            });
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
        const awbCode = order.tracking_number || '';

        console.log(`[LatexLabel] Generating label for order ${orderId}...`);

        try {
            const useLatex = this.canUseLatex();
            console.log(`[LatexLabel] pdflatex available: ${useLatex}`);

            if (useLatex) {
                try {
                    return await this.generateLatex(order, user, timestamp);
                } catch (latexErr) {
                    console.warn(`[LatexLabel] LaTeX failed: ${latexErr.message}, falling back to pdf-lib`);
                }
            }

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

        console.log(`[LatexLabel] Using pdf-lib fallback for order ${orderId}`);

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

        for (let i = 0; i < 35; i++) {
            page.drawText('CASHBACKWALLAH', {
                x: margin - 5,
                y: height - margin - i * 20,
                size: 8,
                font: fontBold,
                color: lightBlue
            });
            page.drawText('CASHBACKWALLAH', {
                x: width - margin - 95,
                y: height - margin - i * 20,
                size: 8,
                font: fontBold,
                color: lightBlue
            });
        }

        y -= 30;
        page.drawRectangle({
            x: margin, y: y - 90,
            width: contentWidth, height: 90,
            borderColor: black, borderWidth: 1
        });

        y -= 15;
        page.drawText('Ship To', { x: margin + 10, y: y, size: 10, font: fontBold, color: black });
        y -= 18;
        page.drawText(receiver.name || '', { x: margin + 10, y: y, size: 12, font: fontBold, color: black });
        y -= 16;
        page.drawText(receiver.address || '', { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
        y -= 14;
        page.drawText(`${receiver.city || ''}, ${receiver.state || ''}, India`, { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
        y -= 14;
        page.drawText(receiver.pincode || '', { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
        y -= 14;
        page.drawText(receiver.phone || '', { x: margin + 10, y: y, size: 10, font: fontBold, color: black });

        y -= 20;
        page.drawRectangle({
            x: margin, y: y - 70,
            width: contentWidth, height: 70,
            borderColor: black, borderWidth: 1
        });

        y -= 15;
        const dim = order.length && order.width && order.height ? `${order.length}x${order.width}x${order.height}` : '1x1x1';
        const paymentMode = (order.payment_mode || 'PREPAID').toUpperCase();
        const totalAmount = Number(order.total_amount || 0);
        
        page.drawText(`Dimensions: ${dim}`, { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
        page.drawText(`Payment: ${paymentMode}`, { x: margin + 10, y: y - 14, size: 9, font: fontRegular, color: black });
        page.drawText(`Order Total: Rs.${this.formatINR(totalAmount)}`, { x: margin + 10, y: y - 28, size: 9, font: fontRegular, color: black });
        page.drawText(`Weight: ${order.weight || 0.2} kg`, { x: margin + 10, y: y - 42, size: 9, font: fontRegular, color: black });

        page.drawText(order.courier_name || '', { x: width - margin - 140, y: y, size: 12, font: fontBold, color: black });
        page.drawText(`AWB: ${order.tracking_number || ''}`, { x: width - margin - 140, y: y - 16, size: 10, font: fontBold, color: black });

        const { barcodePath, qrcodePath } = await this.generateImages(order);
        
        if (barcodePath && fs.existsSync(barcodePath)) {
            const barcodeImg = fs.readFileSync(barcodePath);
            const barcodePng = await pdfDoc.embedPng(barcodeImg);
            page.drawImage(barcodePng, {
                x: width - margin - 180,
                y: y - 55,
                width: 160,
                height: 40
            });
        }

        y -= 90;
        page.drawRectangle({
            x: margin, y: y - 100,
            width: contentWidth, height: 100,
            borderColor: black, borderWidth: 1
        });

        y -= 15;
        page.drawText('Shipped By (if undelivered, return to)', { x: margin + 10, y: y, size: 10, font: fontBold, color: black });
        y -= 16;
        page.drawText(pickup.name || '', { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
        y -= 14;
        page.drawText(pickup.address || '', { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
        y -= 14;
        page.drawText(`${pickup.city || ''}, ${pickup.state || ''}`, { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
        y -= 14;
        page.drawText(pickup.pincode || '', { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
        y -= 14;
        page.drawText(pickup.phone || '', { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
        y -= 28;
        page.drawText('Customer Care: 1800-123-4567', { x: margin + 10, y: y, size: 8, font: fontRegular, color: gray });
        y -= 12;
        page.drawText(`Email: ${pickup.email || 'shiprocket.com'}`, { x: margin + 10, y: y, size: 8, font: fontRegular, color: gray });

        page.drawText(`Order #: ${orderId}`, { x: width - margin - 140, y: y + 75, size: 10, font: fontBold, color: black });
        page.drawText(`Invoice No: ${order.invoice_no || `Retail${String(orderId).slice(-6)}`}`, { x: width - margin - 140, y: y + 60, size: 9, font: fontRegular, color: black });
        page.drawText(`Invoice Date: ${this.formatDate(order.invoice_date || order.created_at)}`, { x: width - margin - 140, y: y + 46, size: 9, font: fontRegular, color: black });
        page.drawText(`Order Date: ${this.formatDate(order.created_at)}`, { x: width - margin - 140, y: y + 32, size: 9, font: fontRegular, color: black });
        page.drawText(`GSTIN: ${user?.gst_number || 'N/A'}`, { x: width - margin - 140, y: y + 18, size: 9, font: fontRegular, color: black });

        y -= 120;
        page.drawRectangle({
            x: margin, y: y - 30,
            width: contentWidth, height: 30,
            borderColor: black, borderWidth: 1
        });
        
        const products = order.products || [];
        page.drawText('Item', { x: margin + 10, y: y - 5, size: 8, font: fontBold, color: black });
        page.drawText('SKU', { x: margin + 100, y: y - 5, size: 8, font: fontBold, color: black });
        page.drawText('Qty', { x: margin + 180, y: y - 5, size: 8, font: fontBold, color: black });
        page.drawText('Price', { x: margin + 230, y: y - 5, size: 8, font: fontBold, color: black });
        page.drawText('Total', { x: margin + 320, y: y - 5, size: 8, font: fontBold, color: black });

        let productY = y - 22;
        const displayProducts = products.length > 0 ? products : [{name: 'N/A', sku: 'N/A', quantity: 1, price: 0}];
        
        displayProducts.forEach((product, idx) => {
            if (idx < 3) {
                const name = (product.name || product.product_name || 'N/A').substring(0, 12);
                const sku = (product.sku || product.channel_sku || 'N/A').substring(0, 8);
                const qty = product.quantity || 1;
                const price = Number(product.price || product.selling_price || 0);
                const total = price * qty;
                
                page.drawText(name, { x: margin + 10, y: productY, size: 8, font: fontRegular, color: black });
                page.drawText(sku, { x: margin + 100, y: productY, size: 8, font: fontRegular, color: black });
                page.drawText(String(qty), { x: margin + 180, y: productY, size: 8, font: fontRegular, color: black });
                page.drawText(`Rs.${this.formatINR(price)}`, { x: margin + 230, y: productY, size: 8, font: fontRegular, color: black });
                page.drawText(`Rs.${this.formatINR(total)}`, { x: margin + 320, y: productY, size: 8, font: fontRegular, color: black });
                productY -= 14;
            }
        });

        y -= 50;
        page.drawRectangle({
            x: margin, y: y - 45,
            width: contentWidth, height: 45,
            borderColor: black, borderWidth: 1
        });

        const platformFee = Number(order.platform_fee || 0);
        const shippingCharge = Number(order.shipping_charge || 0);
        const discount = Number(order.discount || 0);
        const collectable = order.payment_mode === 'COD' ? Number(order.cod_amount || 0) : 0;

        y -= 15;
        page.drawText(`Platform Fee: Rs.${this.formatINR(platformFee)}`, { x: margin + 10, y: y, size: 9, font: fontRegular, color: black });
        page.drawText(`Discount: Rs.${this.formatINR(discount)}`, { x: width - margin - 120, y: y, size: 9, font: fontRegular, color: black });
        page.drawText(`Shipping: Rs.${this.formatINR(shippingCharge)}`, { x: margin + 10, y: y - 18, size: 9, font: fontRegular, color: black });
        page.drawText(`Collectable: Rs.${this.formatINR(collectable)}`, { x: width - margin - 130, y: y - 18, size: 10, font: fontBold, color: black });

        y -= 55;
        page.drawRectangle({
            x: margin, y: y - 30,
            width: contentWidth, height: 30,
            borderColor: black, borderWidth: 1
        });
        page.drawText('All disputes subject to Haryana Jurisdiction only. Goods once sold as per exchange policy.', {
            x: margin + 10, y: y - 10, size: 7, font: fontRegular, color: gray
        });
        page.drawText('Auto generated label - no signature required.', {
            x: margin + 10, y: y - 22, size: 7, font: fontRegular, color: gray
        });

        const footerY = y - 120;
        
        if (qrcodePath && fs.existsSync(qrcodePath)) {
            const qrImg = fs.readFileSync(qrcodePath);
            const qrPng = await pdfDoc.embedPng(qrImg);
            page.drawImage(qrPng, {
                x: margin + 30,
                y: footerY - 50,
                width: 60,
                height: 60
            });
            page.drawText('Get Cashback', { x: margin + 35, footerY: footerY - 60, size: 7, font: fontBold, color: black });
            page.drawText('on WhatsApp', { x: margin + 38, footerY: footerY - 70, size: 7, font: fontBold, color: black });
        }

        page.drawText('CASHBACKWALLAH', {
            x: width / 2 - 100, y: footerY - 20,
            size: 22, font: fontBold, color: purple
        });
        page.drawText("WORLD'S LARGEST FLAT CASHBACK PLATFORM", {
            x: width / 2 - 90, y: footerY - 38,
            size: 8, font: fontRegular, color: purple
        });
        page.drawText('+91 92511 20521 | +91 95096 98208', {
            x: width / 2 - 70, y: footerY - 55,
            size: 9, font: fontRegular, color: green
        });
        page.drawText('@cashbackwallahuniverse', {
            x: width / 2 - 70, y: footerY - 70,
            size: 9, font: fontRegular, color: purple
        });

        if (qrcodePath && fs.existsSync(qrcodePath)) {
            const qrImg = fs.readFileSync(qrcodePath);
            const qrPng = await pdfDoc.embedPng(qrImg);
            page.drawImage(qrPng, {
                x: width - margin - 90,
                y: footerY - 50,
                width: 60,
                height: 60
            });
            page.drawText('Get Cashback', { x: width - margin - 85, footerY: footerY - 60, size: 7, font: fontBold, color: black });
            page.drawText('on Instagram', { x: width - margin - 85, footerY: footerY - 70, size: 7, font: fontBold, color: black });
        }

        const pdfBytes = await pdfDoc.save();
        const filename = `label_${orderId}_${timestamp}.pdf`;
        const pdfPath = path.join(this.labelsDir, filename);
        fs.writeFileSync(pdfPath, pdfBytes);
        console.log(`[LatexLabel] PDF (pdf-lib) written: ${pdfPath}`);

        try {
            const uploadResult = await uploadPdfToCloudinary(Buffer.from(pdfBytes), 'cashbackwallah/labels');
            return uploadResult.secure_url;
        } catch (uploadError) {
            console.error('[LatexLabel] Cloudinary upload failed:', uploadError.message);
            return `/labels/${filename}`;
        } finally {
            [barcodePath, qrcodePath].forEach(f => {
                try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
            });
        }
    }
}

module.exports = new LatexLabelGenerator();