const Vehicle = require("../models/Vehicle");
const Station = require("../models/Station");

// @desc    Get all vehicles with filters
// @route   GET /api/vehicles
// @access  Public
exports.getVehicles = async (req, res) => {
  try {
    const {
      station,
      type,
      status,
      minPrice,
      maxPrice,
      minBattery,
      search,
      page = 1,
      limit = 12,
    } = req.query;

    // Build filter
    const filter = {};

    if (station) filter.currentStation = station;
    if (type) filter.type = type;
    if (status) filter.status = status;
    else filter.status = "available"; // Default show available only

    if (minPrice || maxPrice) {
      filter.pricePerHour = {};
      if (minPrice) filter.pricePerHour.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerHour.$lte = Number(maxPrice);
    }

    // Battery filter
    if (minBattery) {
      filter.currentBatteryLevel = { $gte: Number(minBattery) };
    }

    // Search filter (name or model)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const vehicles = await Vehicle.find(filter)
      .populate("currentStation", "name address coordinates")
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

// @desc    Get vehicle by ID
// @route   GET /api/vehicles/:id
// @access  Public
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "currentStation",
      "name address coordinates phone email operatingHours"
    );

    if (!vehicle) {
      return res.status(404).json({ message: "Không tìm thấy xe" });
    }

    res.json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search vehicles by station location
// @route   GET /api/vehicles/search/nearby
// @access  Public
exports.searchNearbyVehicles = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query; // radius in meters

    if (!lat || !lng) {
      return res.status(400).json({ message: "Vui lòng cung cấp tọa độ" });
    }

    // Find nearby stations
    const stations = await Station.find({
      coordinates: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          $maxDistance: Number(radius),
        },
      },
      isActive: true,
    });

    const stationIds = stations.map((s) => s._id);

    // Find available vehicles at those stations
    const vehicles = await Vehicle.find({
      currentStation: { $in: stationIds },
      status: "available",
    }).populate("currentStation", "name address coordinates");

    res.json({
      success: true,
      data: {
        stations,
        vehicles,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
