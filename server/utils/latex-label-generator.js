const fs = require('fs');
const path = require('path');
const bwipjs = require('bwip-js');
const QRCode = require('qrcode');
const { compile, isAvailable } = require('node-latex-compiler');
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

    async generateBarcode(text, outputPath) {
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
                        console.error('[LatexLabel] Barcode generation error:', err.message);
                        resolve(null);
                    } else {
                        fs.writeFileSync(outputPath, png);
                        resolve(outputPath);
                    }
                });
            } catch (error) {
                console.error('[LatexLabel] Barcode generation error:', error.message);
                resolve(null);
            }
        });
    }

    async generateQR(text, outputPath) {
        try {
            const qrBuffer = await QRCode.toBuffer(text, {
                type: 'png',
                width: 200,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            fs.writeFileSync(outputPath, qrBuffer);
            return outputPath;
        } catch (error) {
            console.error('[LatexLabel] QR generation error:', error.message);
            return null;
        }
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
            const available = isAvailable();
            console.log(`[LatexLabel] Tectonic available: ${available}`);

            if (!available) {
                throw new Error('LaTeX compiler (Tectonic) is not available. Please install node-latex-compiler correctly.');
            }

            const receiver = order.order_receiver_address || {};
            const pickup = order.order_pickup_address || {};

            const len = order.length || order.lengths || 0;
            const wid = order.width || order.breadth || 0;
            const hgt = order.height || 0;
            const dimensions = (len || wid || hgt) ? `${len}x${wid}x${hgt}` : '1x1x1';

            const paymentMode = (order.payment_mode || 'PREPAID').toUpperCase();
            const codAmount = Number(order.cod_amount || 0);
            const collectable = paymentMode === 'COD' ? codAmount : 0;
            const platformFee = Number(order.platform_fee || 0);
            const shippingCharge = Number(order.shipping_charge || 0);
            const discount = Number(order.discount || 0);

            const data = {
                receiver_name: this.escapeLatex(receiver.name || ''),
                receiver_address: this.escapeLatex(receiver.address || ''),
                receiver_city: this.escapeLatex(receiver.city || ''),
                receiver_state: this.escapeLatex(receiver.state || ''),
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
                payment_mode_upper: paymentMode,
                total_amount: this.formatINR(order.total_amount),

                platform_fee: this.formatINR(platformFee),
                shipping_charge: this.formatINR(shippingCharge),
                discount: this.formatINR(discount),
                collectable_amount: this.formatINR(collectable),
                gstin: user?.gst_number || 'N/A',

                ewaybillno: order.ewaybillno || '',
                routing_code: order.routing_code || 'NA',
                rto_routing_code: order.rto_routing_code || 'NA',

                product_table: this.buildProductTable(order.products || [])
            };

            data.barcode_placeholder = data.awb_code ? '\\includegraphics[height=1cm,width=4cm]{BARCODE\_PATH}' : '';
            data.qr_placeholder_left = data.awb_code ? '\\fbox{\\includegraphics[width=1.5cm]{QR\_PATH}}' : '';
            data.qr_placeholder_right = data.awb_code ? '\\fbox{\\includegraphics[width=1.5cm]{QR\_PATH}}' : '';

            let templatePath = path.join(this.templatesDir, 'label-template.tex');
            if (!fs.existsSync(templatePath)) {
                throw new Error(`Template not found: ${templatePath}`);
            }

            let template = fs.readFileSync(templatePath, 'utf8');

            Object.keys(data).forEach(key => {
                const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
                template = template.replace(regex, data[key]);
            });

            const unreplaced = template.match(/\{\{([^}]+)\}\}/g);
            if (unreplaced) {
                console.log(`[LatexLabel] Warning: ${unreplaced.length} unreplaced placeholders`);
                unreplaced.forEach(placeholder => {
                    template = template.replace(placeholder, '');
                });
            }

            const barcodePath = path.join(this.tempDir, `barcode_${timestamp}.png`);
            const qrcodePath = path.join(this.tempDir, `qrcode_${timestamp}.png`);
            const texPath = path.join(this.tempDir, `label_${orderId}_${timestamp}.tex`);

            let barcodefile = null;
            let qrcodefile = null;

            if (data.awb_code) {
                barcodefile = await this.generateBarcode(data.awb_code, barcodePath);
                console.log(`[LatexLabel] Barcode generated: ${barcodefile}`);
            }

            if (data.awb_code) {
                qrcodefile = await this.generateQR(`https://cashbackwallah.com/track/${data.awb_code}`, qrcodePath);
                console.log(`[LatexLabel] QR generated: ${qrcodefile}`);
            }

            const absBarcodePath = barcodefile ? path.resolve(barcodefile) : '';
            const absQrcodePath = qrcodefile ? path.resolve(qrcodefile) : '';

            template = template.replace(/\\ifdefined\\barcodefile[\s\S]*?\\fi/g, '');
            template = template.replace(/\\ifdefined\\qrcodefile[\s\S]*?\\fi/g, '');

            if (absBarcodePath) {
                const barcodeInclude = `\\includegraphics[height=1.2cm,width=3.8cm,keepaspectratio]{${absBarcodePath}}`;
                template = template.replace('\\ifdefined\\barcodefile', '\\begin{document}\\def\\barcodefile{}');
                template = template.replace('\\includegraphics[height=1.2cm,width=3.8cm,keepaspectratio]{\\barcodefile}', barcodeInclude);
            }

            if (absQrcodePath) {
                const qrInclude = `\\fbox{\\includegraphics[width=1.8cm,height=1.8cm]{${absQrcodePath}}}`;
                template = template.replace('\\ifdefined\\qrcodefile', '\\begin{document}\\def\\qrcodefile{}');
                template = template.replace('\\fbox{\\includegraphics[width=1.8cm,height=1.8cm]{\\qrcodefile}}', qrInclude);
            }

            if (!template.includes('\\begin{document}')) {
                template = template.replace(/\\end{document}/g, '');
                template = '\\begin{document}\n' + template + '\n\\end{document}';
            }

            fs.writeFileSync(texPath, template);
            console.log(`[LatexLabel] TeX file written: ${texPath}`);

            try {
                const result = await compile({
                    texFile: texPath,
                    outputDir: this.tempDir,
                    returnBuffer: true
                });

                console.log(`[LatexLabel] Compilation status: ${result.status}`);

                if (result.status !== 'success') {
                    throw new Error(`LaTeX compilation failed: ${result.stderr || result.error}`);
                }

                const pdfBuffer = result.pdfBuffer;
                if (!pdfBuffer || !pdfBuffer.length) {
                    throw new Error('PDF buffer is empty or undefined');
                }

                const filename = `label_${orderId}_${timestamp}.pdf`;
                const pdfPath = path.join(this.labelsDir, filename);
                fs.writeFileSync(pdfPath, pdfBuffer);
                console.log(`[LatexLabel] PDF written: ${pdfPath}`);

                try {
                    const uploadResult = await uploadPdfToCloudinary(pdfBuffer, 'cashbackwallah/labels');
                    console.log(`[LatexLabel] Uploaded to Cloudinary:`, uploadResult.secure_url);

                    [barcodePath, qrcodePath, texPath].forEach(f => {
                        try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
                    });

                    return uploadResult.secure_url;
                } catch (uploadError) {
                    console.error('[LatexLabel] Cloudinary upload failed:', uploadError.message);

                    [barcodePath, qrcodePath, texPath].forEach(f => {
                        try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
                    });

                    return `/labels/${filename}`;
                }
            } catch (latexError) {
                console.error('[LatexLabel] LaTeX compilation error:', latexError.message);

                [barcodePath, qrcodePath].forEach(f => {
                    try { if (f && fs.existsSync(f)) fs.unlinkSync(f); } catch (e) {}
                });

                throw new Error(`LaTeX compilation failed: ${latexError.message}`);
            }
        } catch (error) {
            console.error('[LatexLabel] Error generating label:', error);
            throw error;
        }
    }
}

module.exports = new LatexLabelGenerator();