require('dotenv').config();
const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

// Test VNPay credentials
const testVNPayCredentials = () => {
  console.log('=== Testing VNPay Credentials ===');
  console.log('TMN Code:', process.env.VNPAY_TMN_CODE);
  console.log('Hash Secret:', process.env.VNPAY_HASH_SECRET ? '***' + process.env.VNPAY_HASH_SECRET.slice(-4) : 'NOT SET');
  console.log('VNPay URL:', process.env.VNPAY_URL);
  
  // Create a test transaction query
  const date = new Date();
  const createDate = formatDate(date);
  const transDate = createDate;
  const txnRef = Date.now().toString();
  
  let vnp_Params = {
    vnp_RequestId: Date.now().toString(),
    vnp_Version: '2.1.0',
    vnp_Command: 'querydr',
    vnp_TmnCode: process.env.VNPAY_TMN_CODE,
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: 'Test query',
    vnp_TransactionDate: transDate,
    vnp_CreateDate: createDate,
    vnp_IpAddr: '127.0.0.1'
  };
  
  // Sort params
  vnp_Params = sortObject(vnp_Params);
  
  // Create signature
  const signData = Object.keys(vnp_Params)
    .map(key => `${key}=${vnp_Params[key]}`)
    .join('&');
  
  const hmac = crypto.createHmac('sha512', process.env.VNPAY_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  vnp_Params.vnp_SecureHash = signed;
  
  console.log('\n=== Test Query Params ===');
  console.log(JSON.stringify(vnp_Params, null, 2));
  
  // Make request to VNPay API
  const postData = querystring.stringify(vnp_Params);
  const options = {
    hostname: 'sandbox.vnpayment.vn',
    port: 443,
    path: '/merchant_webapi/api/transaction',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  console.log('\n=== Sending Request to VNPay ===');
  const req = https.request(options, (res) => {
    console.log('Status Code:', res.statusCode);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\n=== VNPay Response ===');
      try {
        const response = JSON.parse(data);
        console.log(JSON.stringify(response, null, 2));
        
        if (response.vnp_ResponseCode === '00') {
          console.log('\n✅ TMN Code is ACTIVE and VALID!');
        } else if (response.vnp_ResponseCode === '02') {
          console.log('\n⚠️ Transaction not found (but TMN Code is valid)');
        } else if (response.vnp_ResponseCode === '97') {
          console.log('\n❌ Invalid signature - Check your Hash Secret!');
        } else if (response.vnp_ResponseCode === '03') {
          console.log('\n❌ Merchant not found - TMN Code is INVALID or NOT ACTIVATED!');
        } else {
          console.log('\n⚠️ Response Code:', response.vnp_ResponseCode);
          console.log('Message:', response.vnp_Message || 'Unknown error');
        }
      } catch (e) {
        console.log('Raw Response:', data);
      }
    });
  });
  
  req.on('error', (e) => {
    console.error('❌ Request Error:', e.message);
  });
  
  req.write(postData);
  req.end();
};

// Helper functions
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  keys.forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}

// Run test
testVNPayCredentials();
