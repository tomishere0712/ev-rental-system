# EV Station-based Rental System 🚗⚡

Hệ thống cho thuê xe điện tại điểm thuê - MERN Stack Application

## 📋 Tổng quan

Phần mềm quản lý cho thuê xe điện với 3 vai trò người dùng:

- **EV Renter** (Người thuê): Đặt xe, quản lý đơn thuê
- **Station Staff** (Nhân viên): Xử lý giao/nhận xe, xác thực khách hàng
- **Admin** (Quản trị): Quản lý toàn bộ hệ thống, báo cáo, phân tích

## 🛠️ Tech Stack

### Backend

- **Node.js** & **Express.js** - REST API
- **MongoDB** & **Mongoose** - Database & ODM
- **JWT** - Authentication
- **Cloudinary** - Image upload
- **Bcrypt** - Password hashing
- **NodeMailer** - Email service

### Frontend

- **React 18** - UI Framework
- **Vite** - Build tool
- **React Router v6** - Routing
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Query** - Server state management
- **React Hook Form + Zod** - Form validation
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Recharts** - Charts & analytics
- **Leaflet** - Maps
- **Headless UI** - Accessible components

## 📁 Cấu trúc Project

```
Project_SDN/
├── backend/
│   ├── config/          # Configuration files
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── middleware/      # Auth, error handling
│   ├── controllers/     # Business logic (TODO)
│   ├── utils/           # Helper functions (TODO)
│   ├── scripts/         # Seed data (TODO)
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── layouts/     # Layout components
│   │   ├── pages/       # Page components
│   │   │   ├── public/  # Public pages
│   │   │   ├── auth/    # Login, Register
│   │   │   ├── renter/  # Renter pages
│   │   │   ├── staff/   # Staff pages
│   │   │   └── admin/   # Admin pages
│   │   ├── lib/         # API client, utils
│   │   ├── store/       # Zustand stores
│   │   └── App.jsx      # Main app
│   └── index.html
└── package.json
```

## 🚀 Cài đặt & Chạy Project

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all dependencies (root, backend, frontend)
npm run install-all
```

### 2. Setup Environment Variables

#### Backend (.env)

```bash
cd backend
cp .env.example .env
# Chỉnh sửa .env với thông tin của bạn
```

#### Frontend (.env)

```bash
cd frontend
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

### 3. Start MongoDB

```bash
# Đảm bảo MongoDB đang chạy
mongod
# hoặc
brew services start mongodb-community
```

### 4. Run Development

```bash
# Chạy cả backend và frontend
npm run dev

# Hoặc chạy riêng:
npm run server  # Backend only - http://localhost:5000
npm run client  # Frontend only - http://localhost:5173
```

## 📱 Tính năng chính

### 🙋 Người thuê (Renter)

- ✅ Đăng ký & xác thực tài khoản
- 📄 Upload giấy phép lái xe & CMND/CCCD
- 🗺️ Tìm điểm thuê trên bản đồ
- 🚗 Xem danh sách xe, đặt xe
- ✍️ Ký hợp đồng điện tử
- 📸 Check-in/out với xác nhận ảnh
- 💳 Thanh toán online
- 📊 Xem lịch sử thuê & phân tích

### 👨‍💼 Nhân viên (Staff)

- 📋 Quản lý xe tại điểm thuê
- 🤝 Xử lý giao/nhận xe
- 📸 Chụp ảnh, kiểm tra tình trạng xe
- ✅ Xác thực giấy tờ khách hàng
- 💰 Xử lý thanh toán & hoàn cọc
- 🔧 Cập nhật trạng thái xe, pin
- 🚨 Báo cáo sự cố

### 👨‍💻 Quản trị (Admin)

- 🚗 Quản lý đội xe & điểm thuê
- 👥 Quản lý khách hàng & nhân viên
- 📊 Báo cáo doanh thu, sử dụng xe
- 📈 Phân tích giờ cao điểm
- 🤖 AI dự báo nhu cầu thuê
- ⚠️ Theo dõi khách hàng rủi ro

## 🗃️ Database Models

### User

- Basic info (email, password, role)
- Personal info (fullName, phone, avatar)
- Verification documents (driver license, national ID)
- Risk assessment (for renters)

### Vehicle

- Basic info (name, model, brand, year, license plate)
- Battery info (capacity, current level, range)
- Pricing (hourly, daily, deposit)
- Status (available, rented, maintenance, charging)
- Current station

### Station

- Location info (address, coordinates)
- Operating hours
- Capacity (parking spots, charging stations)
- Staff assignments

### Booking

- Booking reference number
- Parties (renter, vehicle, station)
- Time (start, end, actual times)
- Pickup/return details (photos, battery, odometer, signatures)
- Pricing & contract
- Status tracking

### Payment

- Transaction details
- Payment method (cash, card, e-wallet)
- Amount & status
- Related booking

## 🎨 UI/UX Features

- ✨ Modern, clean design với Tailwind CSS
- 🌈 Custom color scheme (Primary: Green theme for EV)
- 📱 Fully responsive (mobile, tablet, desktop)
- 🎭 Smooth animations với Framer Motion
- 🎯 Accessible components với Headless UI
- 🔔 Toast notifications
- 📊 Interactive charts với Recharts
- 🗺️ Interactive maps với Leaflet

## 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based access control (RBAC)
- Protected routes
- Token refresh mechanism (TODO)

## 📝 TODO - Implementation Tasks

### Backend

- [ ] Implement controllers logic
- [ ] Add image upload middleware (Multer + Cloudinary)
- [ ] Create seed data script
- [ ] Add input validation
- [ ] Implement email notifications
- [ ] Add rate limiting
- [ ] API documentation (Swagger/Postman)

### Frontend

- [ ] Implement all page components
- [ ] Create reusable UI components (Button, Modal, Card, etc.)
- [ ] Add form validation with React Hook Form + Zod
- [ ] Integrate maps (Leaflet) for station finder
- [ ] Implement image upload & preview
- [ ] Add charts & analytics
- [ ] Create loading states & error handling
- [ ] Add search & filter functionality
- [ ] Implement pagination
- [ ] Add dark mode (optional)



