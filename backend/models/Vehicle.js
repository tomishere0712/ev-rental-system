const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    // Basic Info
    name: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    licensePlate: {
      type: String,
      required: true,
      unique: true,
    },

    // Vehicle Type
    type: {
      type: String,
      enum: ["scooter", "motorcycle", "car"],
      required: true,
    },

    // Battery Info
    batteryCapacity: {
      type: Number,
      required: true, // in kWh
    },
    currentBatteryLevel: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    range: {
      type: Number,
      required: true, // in km
    },

    // Pricing
    pricePerHour: {
      type: Number,
      required: true,
    },
    pricePerDay: {
      type: Number,
      required: true,
    },
    deposit: {
      type: Number,
      required: true,
    },

    // Location
    currentStation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: ["available", "reserved", "rented", "maintenance", "charging", "unavailable"],
      default: "available",
    },

    // Technical Info
    lastMaintenanceDate: {
      type: Date,
    },
    nextMaintenanceDate: {
      type: Date,
    },
    odometer: {
      type: Number,
      default: 0, // in km
    },

    // Images
    images: [
      {
        type: String,
      },
    ],

    // Features
    features: [
      {
        type: String,
      },
    ],

    // Damage/Issue Reports
    currentIssues: [
      {
        description: String,
        reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reportedAt: { type: Date, default: Date.now },
        severity: { type: String, enum: ["low", "medium", "high"] },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
