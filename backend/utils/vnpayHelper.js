const crypto = require("crypto");

// Helper function to format date (yyyyMMddHHmmss)
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// Normalize IP address
const normalizeIp = (ip) => {
  if (!ip) return "127.0.0.1";
  if (ip === "::1") return "127.0.0.1";
  if (ip.includes(",")) return ip.split(",")[0].trim();
  return ip;
};

// Encode value theo chuẩn VNPAY (space -> '+')
const encodeVnpValue = (v) => encodeURIComponent(String(v)).replace(/%20/g, "+");

class VNPayHelper {
  constructor() {
    this.vnpayConfig = {
      vnp_TmnCode: process.env.VNPAY_TMN_CODE,
      vnp_HashSecret: process.env.VNPAY_HASH_SECRET,
      vnp_Url: process.env.VNPAY_URL,
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
      vnp_ApiUrl: process.env.VNPAY_API_URL,
    };
  }

  // Sort object by key
  sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    keys.forEach((key) => {
      sorted[key] = obj[key];
    });
    return sorted;
  }

  // Build sign data (chuẩn VNPAY: key=encodedValue&key=encodedValue)
  buildVnpSignData(paramsObj) {
    const keys = Object.keys(paramsObj)
      .filter((k) => {
        const v = paramsObj[k];
        return v !== undefined && v !== null && String(v) !== "";
      })
      .sort();
    return keys.map((k) => `${k}=${encodeVnpValue(paramsObj[k])}`).join("&");
  }

  // Create payment URL
  createPaymentUrl(params) {
    const {
      amount,
      bankCode = "",
      orderInfo,
      orderType = "other",
      locale = "vn",
      ipAddr,
      orderId,
    } = params;

    const date = new Date();
    const createDate = formatDate(date);
    const exp = new Date(date.getTime() + 15 * 60 * 1000); // +15 minutes
    const expireDate = formatDate(exp);
    
    let vnpParams = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: this.vnpayConfig.vnp_TmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_Amount: Math.round(amount) * 100, // VNPay requires amount * 100
      vnp_ReturnUrl: this.vnpayConfig.vnp_ReturnUrl,
      vnp_IpAddr: normalizeIp(ipAddr),
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    if (bankCode) {
      vnpParams.vnp_BankCode = bankCode;
    }

    // Sort params
    vnpParams = this.sortObject(vnpParams);

    // Debug: Log params before signing
    console.log('=== VNPay Params Before Signing ===');
    console.log(vnpParams);

    // Create signature using buildVnpSignData (CHUẨN VNPAY: encode với space -> '+')
    const signData = this.buildVnpSignData(vnpParams);
    
    console.log('=== Sign Data (Encoded with + for space) ===');
    console.log(signData);

    const hmac = crypto.createHmac("sha512", this.vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    vnpParams.vnp_SecureHash = signed;
    
    console.log('=== Secure Hash ===');
    console.log(signed);

    // Create payment URL (encode lại giống sign data, space -> '+')
    const queryString = Object.keys(vnpParams)
      .map(key => `${key}=${encodeVnpValue(vnpParams[key])}`)
      .join("&");
    
    const paymentUrl = this.vnpayConfig.vnp_Url + "?" + queryString;

    console.log('=== Final Payment URL ===');
    console.log(paymentUrl);

    return paymentUrl;
  }

  // Verify return URL (callback từ VNPay)
  verifyReturnUrl(vnpParams) {
    const secureHash = vnpParams.vnp_SecureHash;
    
    // Remove hash fields
    delete vnpParams.vnp_SecureHash;
    delete vnpParams.vnp_SecureHashType;

    // Sort params
    const sortedParams = this.sortObject(vnpParams);

    // Create signature using buildVnpSignData (CHUẨN: encode với space -> '+')
    const signData = this.buildVnpSignData(sortedParams);
    
    console.log('=== Verify Return URL ===');
    console.log('Received Hash:', secureHash);
    console.log('Sign Data:', signData);
    
    const hmac = crypto.createHmac("sha512", this.vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    
    console.log('Calculated Hash:', signed);
    console.log('Match:', secureHash === signed);

    return secureHash === signed;
  }

  // Query transaction status
  async queryTransaction(params) {
    const { orderId, transDate, ipAddr } = params;

    const date = new Date();
    const requestId = formatDate(date, "HHMMss");
    const createDate = formatDate(date, "yyyymmddHHMMss");

    let data = {
      vnp_RequestId: requestId,
      vnp_Version: "2.1.0",
      vnp_Command: "querydr",
      vnp_TmnCode: this.vnpayConfig.vnp_TmnCode,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Query transaction ${orderId}`,
      vnp_TransactionDate: transDate,
      vnp_CreateDate: createDate,
      vnp_IpAddr: ipAddr,
    };

    // Sort and create signature
    data = this.sortObject(data);
    const signData = querystring.stringify(data, { encode: false });
    const hmac = crypto.createHmac("sha512", this.vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    data.vnp_SecureHash = signed;

    return data;
  }

  // Refund transaction
  async refundTransaction(params) {
    const { orderId, amount, transDate, createdBy, ipAddr } = params;

    const date = new Date();
    const requestId = formatDate(date, "HHMMss");
    const createDate = formatDate(date, "yyyymmddHHMMss");
    const transactionType = "02"; // 02 = full refund, 03 = partial refund

    let data = {
      vnp_RequestId: requestId,
      vnp_Version: "2.1.0",
      vnp_Command: "refund",
      vnp_TmnCode: this.vnpayConfig.vnp_TmnCode,
      vnp_TransactionType: transactionType,
      vnp_TxnRef: orderId,
      vnp_Amount: amount * 100,
      vnp_OrderInfo: `Refund for order ${orderId}`,
      vnp_TransactionDate: transDate,
      vnp_CreateBy: createdBy,
      vnp_CreateDate: createDate,
      vnp_IpAddr: ipAddr,
    };

    // Sort and create signature
    data = this.sortObject(data);
    const signData = querystring.stringify(data, { encode: false });
    const hmac = crypto.createHmac("sha512", this.vnpayConfig.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
    data.vnp_SecureHash = signed;

    return data;
  }
}

module.exports = new VNPayHelper();
