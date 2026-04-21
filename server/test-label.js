const latexLabelGenerator = require('./utils/latex-label-generator');

const dummyOrder = {
    id: 999999,
    length: 10,
    width: 10,
    height: 5,
    weight: 4,
    payment_mode: 'PREPAID',
    total_amount: 5000,
    cod_amount: 0,
    tracking_number: '7D122298844',
    courier_name: 'DTDC Surface',
    invoice_no: 'Retail999999',
    invoice_date: new Date('2026-04-21'),
    created_at: new Date('2026-04-21'),
    ewaybillno: '',
    routing_code: 'NA',
    rto_routing_code: 'NA',
    order_receiver_address: {
        name: 'Rohit Saharan',
        address: 'Shri Krishna Int UDhyog, PO - 19 PBN - Dingwala, Tehsil - Pilibanga, District - Hanumangarh',
        city: 'Hanumangarh',
        state: 'Rajasthan',
        country: 'India',
        pincode: '335803',
        phone: '+91 97992 43900'
    },
    order_pickup_address: {
        name: 'MISW REVALTO LLP',
        address: 'House No 249, Fla No 02, Amba Wadi, Jaipur',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302013',
        phone: '6377860521',
        email: 'cashbackwallah1@gmail.com'
    },
    products: [
        {
            name: 'Clothes',
            sku: 'SKU-999999',
            quantity: 1,
            price: 5000,
            selling_price: 5000
        }
    ]
};

const dummyUser = {
    gst_number: 'N/A'
};

async function test() {
    console.log('Generating test label...');
    try {
        const url = await latexLabelGenerator.generate(dummyOrder, dummyUser);
        console.log('Label generated successfully!');
        console.log('URL:', url);
    } catch (error) {
        console.error('Error generating label:', error);
    }
}

test();