# 🚀 Quick Start Guide

## Bước 1: Cài đặt Dependencies

```bash
# Cài đặt tất cả packages
npm run install-all
```

## Bước 2: Setup MongoDB

Đảm bảo MongoDB đã được cài đặt và đang chạy:

```bash
# macOS với Homebrew
brew services start mongodb-community

# Hoặc chạy trực tiếp
mongod
```

## Bước 3: Config Environment Variables

### Backend

```bash
cd backend
cp .env.example .env
```

Chỉnh sửa `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ev-rental-system
JWT_SECRET=your-secret-key-here
```

### Frontend

```bash
cd frontend
cp .env.example .env
```

File `frontend/.env` đã có config mặc định:

```env
VITE_API_URL=http://localhost:5000/api
```

## Bước 4: Chạy Application

### Option 1: Chạy cả Backend & Frontend cùng lúc

```bash
# Từ thư mục root
npm run dev
```

### Option 2: Chạy riêng từng phần

```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

## Bước 5: Truy cập Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## 🗂️ Cấu trúc URL Routes

### Public Routes

- `/` - Trang chủ
- `/stations` - Danh sách điểm thuê
- `/vehicles` - Danh sách xe điện
- `/login` - Đăng nhập
- `/register` - Đăng ký

### Renter Routes (Người thuê)

- `/renter/dashboard` - Dashboard
- `/renter/book` - Đặt xe
- `/renter/bookings` - Đơn thuê của tôi
- `/renter/history` - Lịch sử
- `/renter/profile` - Hồ sơ

### Staff Routes (Nhân viên)

- `/staff/dashboard` - Dashboard
- `/staff/handover` - Giao/Nhận xe
- `/staff/verify` - Xác thực khách hàng
- `/staff/vehicles` - Xe tại điểm
- `/staff/payment` - Thanh toán

### Admin Routes (Quản trị)

- `/admin/dashboard` - Dashboard
- `/admin/vehicles` - Quản lý xe
- `/admin/stations` - Quản lý điểm thuê
- `/admin/users` - Quản lý khách hàng
- `/admin/staff` - Quản lý nhân viên
- `/admin/reports` - Báo cáo

## 📡 Backend API Endpoints

### Auth

- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Thông tin user hiện tại

### Vehicles

- `GET /api/vehicles` - Danh sách xe
- `GET /api/vehicles/:id` - Chi tiết xe
- `POST /api/vehicles` - Tạo xe mới (Admin)
- `PUT /api/vehicles/:id` - Cập nhật xe
- `PUT /api/vehicles/:id/status` - Cập nhật trạng thái

### Stations

- `GET /api/stations` - Danh sách điểm thuê
- `GET /api/stations/:id` - Chi tiết điểm thuê
- `GET /api/stations/:id/vehicles` - Xe tại điểm thuê

### Bookings

- `POST /api/bookings` - Tạo đơn thuê
- `GET /api/bookings` - Danh sách đơn thuê
- `GET /api/bookings/:id` - Chi tiết đơn thuê
- `PUT /api/bookings/:id/pickup` - Xử lý giao xe
- `PUT /api/bookings/:id/return` - Xử lý trả xe

### Payments

- `POST /api/payments` - Xử lý thanh toán
- `GET /api/payments` - Lịch sử thanh toán
- `POST /api/payments/:id/refund` - Hoàn tiền

### Reports (Admin)

- `GET /api/reports/revenue` - Báo cáo doanh thu
- `GET /api/reports/vehicle-usage` - Báo cáo sử dụng xe
- `GET /api/reports/peak-hours` - Phân tích giờ cao điểm
- `GET /api/reports/demand-forecast` - Dự báo nhu cầu

## 🎨 UI Components & Libraries

### Styling

- **Tailwind CSS** - Utility-first CSS framework
- **Custom components** với class helpers (btn, card, badge, input)

### Components

- **Lucide React** - Beautiful icons
- **Headless UI** - Accessible UI components
- **Framer Motion** - Smooth animations

### Forms & Validation

- **React Hook Form** - Form management
- **Zod** - Schema validation

### Data Visualization

- **Recharts** - Charts và graphs
- **Leaflet** - Interactive maps

### State Management

- **Zustand** - Lightweight state management
- **React Query** - Server state management

## 📝 Next Steps (TODO)

Sau khi setup xong, bạn cần implement:

### Backend

1. **Controllers**: Viết business logic cho từng route
2. **Validators**: Thêm validation cho input
3. **Seed Data**: Tạo dữ liệu mẫu
4. **Upload**: Implement image upload với Cloudinary
5. **Email**: Setup email notifications

### Frontend

1. **Components**: Tạo các component UI tái sử dụng
2. **Forms**: Implement form với validation
3. **API Integration**: Kết nối với backend API
4. **Maps**: Implement bản đồ tìm điểm thuê
5. **Charts**: Thêm charts cho dashboard & reports

## 🐛 Troubleshooting

### MongoDB không kết nối được

```bash
# Kiểm tra MongoDB đang chạy
brew services list | grep mongodb

# Start MongoDB
brew services start mongodb-community
```

### Port đã được sử dụng

```bash
# Kill process đang dùng port 5000
lsof -ti:5000 | xargs kill -9

# Kill process đang dùng port 5173
lsof -ti:5173 | xargs kill -9
```

### Module không tìm thấy

```bash
# Xóa node_modules và cài lại
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install-all
```

## 📚 Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite Guide](https://vitejs.dev/guide/)

---

Happy Coding! 🎉
