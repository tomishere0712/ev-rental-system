# Hướng dẫn Setup VNPay

## 📋 Yêu cầu
Bạn cần có tài khoản VNPay Sandbox (Test) và các thông tin sau:
- **TMN Code** (Mã website)
- **Hash Secret** (Mã bảo mật)

## 🔧 Cấu hình Backend

### 1. Cập nhật file `.env`
Mở file `backend/.env` và điền các thông tin VNPay của bạn:

```bash
# VNPay Configuration
VNPAY_TMN_CODE=<YOUR_TMN_CODE_HERE>
VNPAY_HASH_SECRET=<YOUR_HASH_SECRET_HERE>
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5173/payment/vnpay-return
VNPAY_API_URL=https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
```

### 2. Thay thế các giá trị
- Thay `<YOUR_TMN_CODE_HERE>` bằng TMN Code của bạn
- Thay `<YOUR_HASH_SECRET_HERE>` bằng Hash Secret của bạn

**Ví dụ:**
```bash
VNPAY_TMN_CODE=DEMOSHOP
VNPAY_HASH_SECRET=DHTK6TAFBVT9WPKTWWVUGV6X1S
```

## 🧪 Test VNPay Sandbox

### Thông tin test mặc định của VNPay:
- **Tên chủ thẻ**: NGUYEN VAN A
- **Số thẻ**: 9704198526191432198
- **Ngày hết hạn**: 07/15
- **Tên chủ thẻ (trên thẻ)**: NGUYEN VAN A
- **OTP**: Bất kỳ (6 chữ số)

## 🚀 Sử dụng

### Flow thanh toán:
1. User chọn xe và điền thông tin đặt xe
2. Click "Xác nhận đặt xe"
3. Hệ thống tạo booking trong database
4. Chuyển hướng đến trang thanh toán VNPay
5. User nhập thông tin thẻ test
6. VNPay callback về `/api/payments/vnpay-return`
7. Hệ thống cập nhật trạng thái booking
8. Chuyển đến trang thành công/thất bại

### API Endpoints:

#### 1. Tạo URL thanh toán VNPay
```
POST /api/payments/create-vnpay-url
Authorization: Bearer <token>
Body: {
  "bookingId": "..."
}
```

#### 2. Callback từ VNPay (auto)
```
GET /api/payments/vnpay-return?vnp_...
```

#### 3. Query giao dịch
```
POST /api/payments/vnpay-query
Authorization: Bearer <token>
Body: {
  "orderId": "...",
  "transDate": "20231102150000"
}
```

## 📱 Frontend

Frontend đã được setup tự động với các trang:
- `/payment/success` - Trang thanh toán thành công
- `/payment/failed` - Trang thanh toán thất bại

## 🔍 Debug

### Kiểm tra logs:
```bash
# Terminal backend sẽ hiển thị:
VNPay return params: { vnp_TxnRef, vnp_ResponseCode, ... }
```

### Response Codes phổ biến:
- `00`: Giao dịch thành công
- `07`: Trừ tiền thành công nhưng giao dịch nghi ngờ
- `09`: Thẻ/Tài khoản chưa đăng ký dịch vụ
- `10`: Xác thực thông tin không thành công
- `11`: Hết hạn chờ thanh toán
- `24`: Khách hàng hủy giao dịch

## 📚 Tài liệu tham khảo
- VNPay API Docs: https://sandbox.vnpayment.vn/apis/docs/
- Sandbox Portal: https://sandbox.vnpayment.vn/

## ⚠️ Lưu ý
- Đây là môi trường **SANDBOX** (test), không dùng cho production
- Không commit file `.env` lên git
- Return URL phải được đăng ký trên VNPay Portal
