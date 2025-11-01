const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const connectDB = require("./config/database");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(compression()); // Compress responses
app.use(morgan("dev")); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/vehicles", require("./routes/vehicle.routes"));
app.use("/api/stations", require("./routes/station.routes"));
app.use("/api/bookings", require("./routes/booking.routes"));
app.use("/api/payments", require("./routes/payment.routes"));
app.use("/api/reports", require("./routes/report.routes"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "EV Rental API is running" });
});

// Error handling middleware
app.use(require("./middleware/errorHandler"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
  );
});
