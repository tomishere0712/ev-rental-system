const mongoose = require("mongoose");
const Station = require("./models/Station");
require("dotenv").config();

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/ev-rental-system"
  )
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const sampleStations = [
  {
    name: "Điểm thuê Q1 - Nguyễn Huệ",
    code: "HCM-Q1-001",
    address: {
      street: "123 Nguyễn Huệ",
      district: "Quận 1",
      city: "Hồ Chí Minh",
      country: "Vietnam",
    },
    coordinates: {
      lat: 10.7747,
      lng: 106.7009,
    },
    phone: "0901234567",
    email: "q1@evrental.com",
    operatingHours: {
      monday: { open: "00:00", close: "23:59" },
      tuesday: { open: "00:00", close: "23:59" },
      wednesday: { open: "00:00", close: "23:59" },
      thursday: { open: "00:00", close: "23:59" },
      friday: { open: "00:00", close: "23:59" },
      saturday: { open: "00:00", close: "23:59" },
      sunday: { open: "00:00", close: "23:59" },
    },
    totalParkingSpots: 20,
    chargingStations: 8,
    facilities: ["Bãi đỗ xe", "Trạm sạc nhanh", "WiFi miễn phí", "Phòng chờ"],
    isActive: true,
  },
  {
    name: "Điểm thuê Q3 - Võ Văn Tần",
    code: "HCM-Q3-001",
    address: {
      street: "456 Võ Văn Tần",
      district: "Quận 3",
      city: "Hồ Chí Minh",
      country: "Vietnam",
    },
    coordinates: {
      lat: 10.7824,
      lng: 106.6877,
    },
    phone: "0901234568",
    email: "q3@evrental.com",
    operatingHours: {
      monday: { open: "06:00", close: "22:00" },
      tuesday: { open: "06:00", close: "22:00" },
      wednesday: { open: "06:00", close: "22:00" },
      thursday: { open: "06:00", close: "22:00" },
      friday: { open: "06:00", close: "22:00" },
      saturday: { open: "08:00", close: "20:00" },
      sunday: { open: "08:00", close: "20:00" },
    },
    totalParkingSpots: 15,
    chargingStations: 6,
    facilities: ["Bãi đỗ xe", "Trạm sạc", "WiFi"],
    isActive: true,
  },
  {
    name: "Điểm thuê Q7 - Phú Mỹ Hưng",
    code: "HCM-Q7-001",
    address: {
      street: "789 Nguyễn Lương Bằng",
      district: "Quận 7",
      city: "Hồ Chí Minh",
      country: "Vietnam",
    },
    coordinates: {
      lat: 10.7295,
      lng: 106.7275,
    },
    phone: "0901234569",
    email: "q7@evrental.com",
    operatingHours: {
      monday: { open: "00:00", close: "23:59" },
      tuesday: { open: "00:00", close: "23:59" },
      wednesday: { open: "00:00", close: "23:59" },
      thursday: { open: "00:00", close: "23:59" },
      friday: { open: "00:00", close: "23:59" },
      saturday: { open: "00:00", close: "23:59" },
      sunday: { open: "00:00", close: "23:59" },
    },
    totalParkingSpots: 30,
    chargingStations: 12,
    facilities: [
      "Bãi đỗ xe lớn",
      "Trạm sạc siêu nhanh",
      "Cafe",
      "WiFi miễn phí",
    ],
    isActive: true,
  },
  {
    name: "Điểm thuê Bình Thạnh - Vincom",
    code: "HCM-BT-001",
    address: {
      street: "12 Điện Biên Phủ",
      district: "Bình Thạnh",
      city: "Hồ Chí Minh",
      country: "Vietnam",
    },
    coordinates: {
      lat: 10.7991,
      lng: 106.7128,
    },
    phone: "0901234570",
    email: "binhthanh@evrental.com",
    operatingHours: {
      monday: { open: "08:00", close: "22:00" },
      tuesday: { open: "08:00", close: "22:00" },
      wednesday: { open: "08:00", close: "22:00" },
      thursday: { open: "08:00", close: "22:00" },
      friday: { open: "08:00", close: "22:00" },
      saturday: { open: "08:00", close: "23:00" },
      sunday: { open: "08:00", close: "23:00" },
    },
    totalParkingSpots: 12,
    chargingStations: 5,
    facilities: ["Trong TTTM", "Trạm sạc", "WiFi", "Giữ xe miễn phí"],
    isActive: true,
  },
  {
    name: "Điểm thuê Q2 - Thảo Điền",
    code: "HCM-Q2-001",
    address: {
      street: "345 Xa Lộ Hà Nội",
      district: "Quận 2",
      city: "Hồ Chí Minh",
      country: "Vietnam",
    },
    coordinates: {
      lat: 10.8055,
      lng: 106.7447,
    },
    phone: "0901234571",
    email: "q2@evrental.com",
    operatingHours: {
      monday: { open: "00:00", close: "23:59" },
      tuesday: { open: "00:00", close: "23:59" },
      wednesday: { open: "00:00", close: "23:59" },
      thursday: { open: "00:00", close: "23:59" },
      friday: { open: "00:00", close: "23:59" },
      saturday: { open: "00:00", close: "23:59" },
      sunday: { open: "00:00", close: "23:59" },
    },
    totalParkingSpots: 25,
    chargingStations: 10,
    facilities: ["Bãi đỗ xe", "Trạm sạc nhanh", "Khu vực chờ VIP"],
    isActive: true,
  },
  {
    name: "Điểm thuê Gò Vấp - Quang Trung",
    code: "HCM-GV-001",
    address: {
      street: "678 Quang Trung",
      district: "Gò Vấp",
      city: "Hồ Chí Minh",
      country: "Vietnam",
    },
    coordinates: {
      lat: 10.8395,
      lng: 106.6767,
    },
    phone: "0901234572",
    email: "govap@evrental.com",
    operatingHours: {
      monday: { open: "06:00", close: "21:00" },
      tuesday: { open: "06:00", close: "21:00" },
      wednesday: { open: "06:00", close: "21:00" },
      thursday: { open: "06:00", close: "21:00" },
      friday: { open: "06:00", close: "21:00" },
      saturday: { open: "07:00", close: "20:00" },
      sunday: { open: "07:00", close: "20:00" },
    },
    totalParkingSpots: 10,
    chargingStations: 4,
    facilities: ["Bãi đỗ xe", "Trạm sạc", "Phòng chờ điều hòa"],
    isActive: true,
  },
];

async function seedStations() {
  try {
    // Clear existing stations
    await Station.deleteMany({});
    console.log("🗑️  Cleared existing stations");

    // Insert sample stations
    const stations = await Station.insertMany(sampleStations);
    console.log(`✅ Seeded ${stations.length} stations successfully!`);

    stations.forEach((station) => {
      console.log(
        `   - ${station.name} (${station.code}): [${station.coordinates.lat}, ${station.coordinates.lng}]`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding stations:", error);
    process.exit(1);
  }
}

seedStations();
