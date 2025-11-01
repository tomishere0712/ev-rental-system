const Station = require("../models/Station");
const Vehicle = require("../models/Vehicle");

// @desc    Get all stations
// @route   GET /api/stations
// @access  Public
exports.getStations = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const stations = await Station.find({ isActive: true })
      .limit(parseInt(limit))
      .populate("staff", "fullName phone email")
      .populate("manager", "fullName phone email");

    res.json({
      success: true,
      data: {
        stations,
        total: stations.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get station by ID
// @route   GET /api/stations/:id
// @access  Public
exports.getStationById = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id)
      .populate("staff", "fullName phone email avatar")
      .populate("manager", "fullName phone email avatar");

    if (!station) {
      return res.status(404).json({ message: "Không tìm thấy điểm thuê" });
    }

    res.json({
      success: true,
      data: station,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get available vehicles at station
// @route   GET /api/stations/:id/vehicles
// @access  Public
exports.getStationVehicles = async (req, res) => {
  try {
    const { status = "available" } = req.query;

    const vehicles = await Vehicle.find({
      currentStation: req.params.id,
      ...(status && { status }),
    });

    res.json({
      success: true,
      data: vehicles,
      count: vehicles.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search stations by location
// @route   GET /api/stations/search/nearby
// @access  Public
exports.searchNearbyStations = async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query; // radius in meters (default 10km)

    if (!lat || !lng) {
      return res.status(400).json({ message: "Vui lòng cung cấp tọa độ" });
    }

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

    res.json({
      success: true,
      data: stations,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
