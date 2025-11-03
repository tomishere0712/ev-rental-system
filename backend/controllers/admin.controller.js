const Vehicle = require("../models/Vehicle");
const Station = require("../models/Station");
const User = require("../models/User");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

// @desc    Get admin dashboard overview stats
// @route   GET /api/admin/stats/overview
// @access  Private/Admin
exports.getOverviewStats = async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments();
    const availableVehicles = await Vehicle.countDocuments({
      status: "available",
    });
    const rentedVehicles = await Vehicle.countDocuments({ status: "rented" });
    const maintenanceVehicles = await Vehicle.countDocuments({
      status: "maintenance",
    });

    const totalStations = await Station.countDocuments();
    const totalUsers = await User.countDocuments({ role: "renter" });
    const totalStaff = await User.countDocuments({ role: "staff" });

    const activeBookings = await Booking.countDocuments({
      status: "picked-up",
    });
    const pendingBookings = await Booking.countDocuments({ status: "pending" });

    // Calculate total revenue
    const payments = await Payment.find({ paymentStatus: "completed" });
    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Revenue this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyPayments = await Payment.find({
      paymentStatus: "completed",
      createdAt: { $gte: startOfMonth },
    });
    const monthlyRevenue = monthlyPayments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    res.json({
      success: true,
      data: {
        vehicles: {
          total: totalVehicles,
          available: availableVehicles,
          rented: rentedVehicles,
          maintenance: maintenanceVehicles,
        },
        stations: totalStations,
        users: {
          renters: totalUsers,
          staff: totalStaff,
        },
        bookings: {
          active: activeBookings,
          pending: pendingBookings,
        },
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get vehicle usage by hour (for peak hour analysis)
// @route   GET /api/admin/stats/vehicle-usage-by-hour?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private/Admin
exports.getVehicleUsageByHour = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter - default to last 7 days if not provided
    let dateFilter = {};
    if (startDate || endDate) {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
    } else {
      // Default: last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      dateFilter.$gte = sevenDaysAgo;
    }

    // Get bookings with pickup time
    const bookings = await Booking.find({
      createdAt: dateFilter,
      status: { $in: ["picked-up", "completed"] }, // Only completed bookings
    });

    // Group by hour of day (0-23)
    const hourMap = {};
    for (let i = 0; i < 24; i++) {
      hourMap[i] = {
        hour: i,
        count: 0,
        vehicles: new Set(), // Track unique vehicles
        avgDuration: 0,
        totalDuration: 0,
      };
    }

    bookings.forEach((booking) => {
      const hour = new Date(booking.createdAt).getHours();
      hourMap[hour].count += 1;

      if (booking.vehicle) {
        hourMap[hour].vehicles.add(booking.vehicle.toString());
      }

      // Calculate booking duration if available
      if (booking.pickupTime && booking.returnTime) {
        const duration =
          (new Date(booking.returnTime) - new Date(booking.pickupTime)) /
          (1000 * 60 * 60); // in hours
        hourMap[hour].totalDuration += duration;
      }
    });

    // Convert to array and calculate averages
    const data = Object.values(hourMap).map((item) => ({
      hour: item.hour,
      bookings: item.count,
      uniqueVehicles: item.vehicles.size,
      avgDuration:
        item.count > 0 ? (item.totalDuration / item.count).toFixed(2) : 0,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get revenue by station
// @route   GET /api/admin/stats/revenue-by-station?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private/Admin
exports.getRevenueByStation = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      dateFilter.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    const paymentFilter = {
      paymentStatus: "completed",
    };
    if (Object.keys(dateFilter).length > 0) {
      paymentFilter.createdAt = dateFilter;
    }

    const payments = await Payment.find(paymentFilter).populate({
      path: "bookingId",
      populate: { path: "pickupStation", select: "name code" },
    });

    const revenueMap = {};

    payments.forEach((payment) => {
      if (payment.bookingId && payment.bookingId.pickupStation) {
        const stationName = payment.bookingId.pickupStation.name;
        if (!revenueMap[stationName]) {
          revenueMap[stationName] = { revenue: 0, bookings: 0 };
        }
        revenueMap[stationName].revenue += payment.amount;
        revenueMap[stationName].bookings += 1;
      }
    });

    const data = Object.keys(revenueMap).map((name) => ({
      station: name,
      revenue: revenueMap[name].revenue,
      bookings: revenueMap[name].bookings,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get bookings trend
// @route   GET /api/admin/stats/bookings-trend?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private/Admin
exports.getBookingsTrend = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter - default to last 30 days if not provided
    let dateFilter = {};
    if (startDate || endDate) {
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
    } else {
      // Default: last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter.$gte = thirtyDaysAgo;
    }

    const bookings = await Booking.find({
      createdAt: dateFilter,
    });

    // Group by date
    const trendMap = {};
    bookings.forEach((booking) => {
      const date = booking.createdAt.toISOString().split("T")[0];
      if (!trendMap[date]) {
        trendMap[date] = 0;
      }
      trendMap[date]++;
    });

    const data = Object.keys(trendMap)
      .sort()
      .map((date) => ({
        date,
        bookings: trendMap[date],
      }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get vehicle status distribution
// @route   GET /api/admin/stats/vehicle-distribution
// @access  Private/Admin
exports.getVehicleDistribution = async (req, res) => {
  try {
    const distribution = await Vehicle.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const data = distribution.map((item) => ({
      status: item._id,
      count: item.count,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recent bookings
// @route   GET /api/admin/stats/recent-bookings
// @access  Private/Admin
exports.getRecentBookings = async (req, res) => {
  try {
    const limit = req.query.limit || 10;

    const bookings = await Booking.find()
      .populate("renter", "fullName email")
      .populate("vehicle", "brand model name")
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    const data = bookings.map((booking) => ({
      _id: booking._id,
      bookingNumber: booking.bookingNumber,
      user: booking.renter,
      vehicle: booking.vehicle,
      totalAmount:
    booking?.pricing?.totalAmount ||
    booking?.payment?.amount ||
    0, // fallback nếu chưa có dữ liệu
      status: booking.status,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all vehicles (Admin)
// @route   GET /api/admin/vehicles
// @access  Private/Admin
exports.getAllVehicles = async (req, res) => {
  try {
    const { status, type, station, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (station) filter.currentStation = station;

    const skip = (page - 1) * limit;

    const vehicles = await Vehicle.find(filter)
      .populate("currentStation", "name address code")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await Vehicle.countDocuments(filter);

    res.json({
      success: true,
      data: {
        vehicles,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create vehicle
// @route   POST /api/admin/vehicles
// @access  Private/Admin
exports.createVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.create(req.body);

    res.status(201).json({
      success: true,
      data: vehicle,
      message: "Đã thêm xe thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update vehicle
// @route   PUT /api/admin/vehicles/:id
// @access  Private/Admin
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!vehicle) {
      return res.status(404).json({ message: "Không tìm thấy xe" });
    }

    res.json({
      success: true,
      data: vehicle,
      message: "Đã cập nhật xe thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete vehicle
// @route   DELETE /api/admin/vehicles/:id
// @access  Private/Admin
exports.deleteVehicle = async (req, res) => {
  try {
    // Check if vehicle has active bookings
    const activeBooking = await Booking.findOne({
      vehicle: req.params.id,
      status: { $in: ["pending", "confirmed", "picked-up"] },
    });

    if (activeBooking) {
      return res.status(400).json({
        message: "Không thể xóa xe đang có booking hoạt động",
      });
    }

    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ message: "Không tìm thấy xe" });
    }

    res.json({
      success: true,
      message: "Đã xóa xe thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Transfer vehicle to another station
// @route   PUT /api/admin/vehicles/:id/transfer
// @access  Private/Admin
exports.transferVehicle = async (req, res) => {
  try {
    const { stationId } = req.body;

    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ message: "Không tìm thấy điểm thuê" });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { currentStation: stationId },
      { new: true }
    ).populate("currentStation");

    if (!vehicle) {
      return res.status(404).json({ message: "Không tìm thấy xe" });
    }

    res.json({
      success: true,
      data: vehicle,
      message: `Đã chuyển xe đến ${station.name}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all stations
// @route   GET /api/admin/stations
// @access  Private/Admin
exports.getAllStations = async (req, res) => {
  try {
    const stations = await Station.find()
      .populate("staff", "fullName email phone")
      .populate("manager", "fullName email phone")
      .sort({ createdAt: -1 });

    // Get vehicle count for each station
    const stationsWithCount = await Promise.all(
      stations.map(async (station) => {
        const vehicleCount = await Vehicle.countDocuments({
          currentStation: station._id,
        });

        // Convert to object while preserving populated fields
        const stationObj = station.toObject();
        return {
          ...stationObj,
          vehicleCount,
        };
      })
    );

    res.json({
      success: true,
      data: stationsWithCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create station
// @route   POST /api/admin/stations
// @access  Private/Admin
exports.createStation = async (req, res) => {
  try {
    const station = await Station.create(req.body);

    res.status(201).json({
      success: true,
      data: station,
      message: "Đã thêm điểm thuê thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update station
// @route   PUT /api/admin/stations/:id
// @access  Private/Admin
exports.updateStation = async (req, res) => {
  try {
    const station = await Station.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!station) {
      return res.status(404).json({ message: "Không tìm thấy điểm thuê" });
    }

    res.json({
      success: true,
      data: station,
      message: "Đã cập nhật điểm thuê thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete station
// @route   DELETE /api/admin/stations/:id
// @access  Private/Admin
exports.deleteStation = async (req, res) => {
  try {
    // Check if station has vehicles
    const vehicleCount = await Vehicle.countDocuments({
      currentStation: req.params.id,
    });

    if (vehicleCount > 0) {
      return res.status(400).json({
        message: `Không thể xóa điểm thuê còn ${vehicleCount} xe`,
      });
    }

    const station = await Station.findByIdAndDelete(req.params.id);

    if (!station) {
      return res.status(404).json({ message: "Không tìm thấy điểm thuê" });
    }

    res.json({
      success: true,
      message: "Đã xóa điểm thuê thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users/customers
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { role, riskLevel, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (role) filter.role = role;
    else filter.role = "renter"; // Default show renters
    if (riskLevel) filter.riskLevel = riskLevel;

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await User.countDocuments(filter);

    // Get booking count for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const bookingCount = await Booking.countDocuments({ renter: user._id });
        const totalSpent = await Payment.aggregate([
          {
            $match: {
              userId: user._id,
              paymentStatus: "completed",
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
            },
          },
        ]);

        return {
          ...user.toObject(),
          bookingCount,
          totalSpent: totalSpent[0]?.total || 0,
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user by ID with details
// @route   GET /api/admin/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const bookings = await Booking.find({ renter: user._id })
      .populate("vehicle", "name model images")
      .populate("pickupStation", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    const totalSpent = await Payment.aggregate([
      {
        $match: {
          userId: user._id,
          paymentStatus: "completed",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        user,
        bookings,
        totalSpent: totalSpent[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user risk level
// @route   PUT /api/admin/users/:id/risk-level
// @access  Private/Admin
exports.updateUserRiskLevel = async (req, res) => {
  try {
    const { riskLevel, violationCount, notes } = req.body;

    // Load existing user first to be able to fallback to current values
    const existingUser = await User.findById(req.params.id).select("-password");
    if (!existingUser) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    const updatedFields = {
      riskLevel: riskLevel !== undefined ? riskLevel : existingUser.riskLevel,
      violationCount:
        violationCount !== undefined
          ? violationCount
          : existingUser.violationCount,
    };

    // Only include notes if provided
    if (notes !== undefined) updatedFields.notes = notes;

    const user = await User.findByIdAndUpdate(req.params.id, updatedFields, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.json({
      success: true,
      data: user,
      message: "Đã cập nhật mức độ rủi ro",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Block/Unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
exports.blockUser = async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    res.json({
      success: true,
      data: user,
      message: isActive ? "Đã mở khóa người dùng" : "Đã khóa người dùng",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all staff
// @route   GET /api/admin/staff
// @access  Private/Admin
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: "staff" })
      .select("-password")
      .populate("assignedStation", "name address code")
      .sort({ createdAt: -1 });

    // Get performance stats for each staff
    const staffWithStats = await Promise.all(
      staff.map(async (member) => {
        const bookingsProcessed = await Booking.countDocuments({
          verifiedBy: member._id,
        });

        return {
          ...member.toObject(),
          bookingsProcessed,
        };
      })
    );

    res.json({
      success: true,
      data: staffWithStats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create staff
// @route   POST /api/admin/staff
// @access  Private/Admin
exports.createStaff = async (req, res) => {
  try {
    const { email, password, fullName, phone, assignedStation } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const staff = await User.create({
      email,
      password,
      fullName,
      phone,
      role: "staff",
      assignedStation,
      isActive: true,
      isVerified: true,
    });

    // Update Station.staff array (two-way reference)
    if (assignedStation) {
      await Station.findByIdAndUpdate(assignedStation, {
        $addToSet: { staff: staff._id },
      });
    }

    const staffData = await User.findById(staff._id)
      .select("-password")
      .populate("assignedStation");

    res.status(201).json({
      success: true,
      data: staffData,
      message: "Đã thêm nhân viên thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update staff
// @route   PUT /api/admin/staff/:id
// @access  Private/Admin
exports.updateStaff = async (req, res) => {
  try {
    const { fullName, phone, assignedStation, isActive } = req.body;

    // Get current staff to check old station
    const oldStaff = await User.findById(req.params.id);
    if (!oldStaff) {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const oldStationId = oldStaff.assignedStation?.toString();
    const newStationId = assignedStation?.toString();

    // Update staff
    const staff = await User.findByIdAndUpdate(
      req.params.id,
      { fullName, phone, assignedStation, isActive },
      { new: true }
    )
      .select("-password")
      .populate("assignedStation");

    // Update Station.staff arrays (two-way reference)
    if (oldStationId !== newStationId) {
      // Remove from old station
      if (oldStationId) {
        await Station.findByIdAndUpdate(oldStationId, {
          $pull: { staff: req.params.id },
        });
      }

      // Add to new station
      if (newStationId) {
        await Station.findByIdAndUpdate(newStationId, {
          $addToSet: { staff: req.params.id },
        });
      }
    }

    res.json({
      success: true,
      data: staff,
      message: "Đã cập nhật thông tin nhân viên",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete staff
// @route   DELETE /api/admin/staff/:id
// @access  Private/Admin
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id);

    if (!staff || staff.role !== "staff") {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    // Remove from station's staff array (two-way reference)
    if (staff.assignedStation) {
      await Station.findByIdAndUpdate(staff.assignedStation, {
        $pull: { staff: req.params.id },
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Đã xóa nhân viên thành công",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get staff performance
// @route   GET /api/admin/staff/:id/performance
// @access  Private/Admin
exports.getStaffPerformance = async (req, res) => {
  try {
    const staff = await User.findById(req.params.id)
      .select("-password")
      .populate("assignedStation");

    if (!staff || staff.role !== "staff") {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    // Number of bookings the staff verified (used earlier in other stats)
    const bookingsVerified = await Booking.countDocuments({
      verifiedBy: staff._id,
    });

    // Number of payments processed by this staff (if tracked)
    const paymentsProcessed = await Payment.countDocuments({
      processedBy: staff._id,
    });

    // Count handovers (pickups processed by this staff)
    const handoversCount = await Booking.countDocuments({
      "pickupDetails.checkedInBy": staff._id,
    });

    // Count returns (returns processed by this staff)
    const returnsCount = await Booking.countDocuments({
      "returnDetails.checkedInBy": staff._id,
    });

    // Recent activity (last 30 days) based on verification or handovers
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBookings = await Booking.countDocuments({
      $or: [
        { verifiedBy: staff._id },
        { "pickupDetails.checkedInBy": staff._id },
        { "returnDetails.checkedInBy": staff._id },
      ],
      updatedAt: { $gte: thirtyDaysAgo },
    });

    // Customer satisfaction proxy:
    // Because there is no explicit rating/review model in the repo,
    // we compute a simple proxy: percentage of returns processed by this staff
    // that did NOT have a damageReport (i.e. no reported issues).
    // If there are no returns processed, satisfactionScore will be null.
    const returns = await Booking.find({
      "returnDetails.checkedInBy": staff._id,
    }).select("returnDetails.damageReport");

    let satisfactionScore = null;
    if (returns.length > 0) {
      const cleanReturns = returns.filter(
        (b) => !b.returnDetails?.damageReport
      );
      satisfactionScore = Math.round(
        (cleanReturns.length / returns.length) * 100
      ); // percent
    }

    res.json({
      success: true,
      data: {
        staff,
        performance: {
          bookingsVerified,
          paymentsProcessed,
          handoversCount,
          returnsCount,
          recentBookings,
          satisfactionScore, // percent or null
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign station to staff
// @route   PUT /api/admin/staff/:id/assign-station
// @access  Private/Admin
exports.assignStaffToStation = async (req, res) => {
  try {
    const { stationId } = req.body;

    if (!stationId) {
      return res.status(400).json({ message: "Vui lòng chọn trạm" });
    }

    // Verify station exists
    const station = await Station.findById(stationId);
    if (!station) {
      return res.status(404).json({ message: "Không tìm thấy trạm" });
    }

    // Get current staff to check old station
    const oldStaff = await User.findById(req.params.id);
    if (!oldStaff || oldStaff.role !== "staff") {
      return res.status(404).json({ message: "Không tìm thấy nhân viên" });
    }

    const oldStationId = oldStaff.assignedStation?.toString();
    const newStationId = stationId?.toString();

    // Update staff's assigned station
    const staff = await User.findByIdAndUpdate(
      req.params.id,
      { assignedStation: stationId },
      { new: true }
    )
      .select("-password")
      .populate("assignedStation");

    // Update Station.staff arrays (two-way reference)
    if (oldStationId !== newStationId) {
      // Remove from old station
      if (oldStationId) {
        await Station.findByIdAndUpdate(oldStationId, {
          $pull: { staff: req.params.id },
        });
      }

      // Add to new station
      if (newStationId) {
        await Station.findByIdAndUpdate(newStationId, {
          $addToSet: { staff: req.params.id },
        });
      }
    }

    res.json({
      success: true,
      data: staff,
      message: `Đã phân công nhân viên ${staff.fullName} đến trạm ${station.name}`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = exports;
