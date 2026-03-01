
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const url = process.env.DATABASE_URL;
if (url && url.includes('fswogsosgg8g0owkggccsso0')) {
    console.log('Host MATCHES Coolify host');
} else {
    console.log('Host DOES NOT match Coolify host');
    // console.log('Current URL (masked):', url ? url.replace(/:[^@]*@/, ':***@') : 'none');
}
