const mongoose = require("mongoose");

const stationSchema = new mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },

    // Location
    address: {
      street: String,
      ward: String,
      district: String,
      city: String,
      country: { type: String, default: "Vietnam" },
    },
    coordinates: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },

    // Contact
    phone: String,
    email: String,

    // Operating Hours
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },

    // Capacity
    totalParkingSpots: {
      type: Number,
      required: true,
    },
    chargingStations: {
      type: Number,
      required: true,
    },

    // Staff
    staff: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Facilities
    facilities: [
      {
        type: String,
      },
    ],

    // Images
    images: [
      {
        type: String,
      },
    ],

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for available vehicles count
stationSchema.virtual("vehiclesCount", {
  ref: "Vehicle",
  localField: "_id",
  foreignField: "currentStation",
  count: true,
});

module.exports = mongoose.model("Station", stationSchema);
