const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // Booking Reference
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
    },

    // Parties Involved
    renter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },
    station: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },

    // Booking Time
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    actualStartDate: Date,
    actualEndDate: Date,

    // Pickup & Return
    pickupStation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },
    returnStation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
      required: true,
    },

    // Vehicle Handover Details
    pickupDetails: {
      checkedInAt: Date,
      checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Staff
      batteryLevel: Number,
      odometer: Number,
      condition: String,
      photos: [String],
      notes: String,
      signature: String, // Digital signature URL
    },

    returnDetails: {
      checkedInAt: Date,
      checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Staff
      batteryLevel: Number,
      odometer: Number,
      condition: String,
      photos: [String],
      notes: String,
      damageReport: String,
      signature: String,
    },

    // Pricing
    pricing: {
      basePrice: Number,
      deposit: Number,
      additionalCharges: [
        {
          type: String,
          amount: Number,
          description: String,
        },
      ],
      discount: Number,
      totalAmount: Number,
    },

    // Payment
    payment: {
      orderCode: String,
      method: {
        type: String,
        enum: ["online", "cash", "bank_transfer"],
        default: "online",
      },
      amount: Number,
      status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
      paidAt: Date,
      refundedAt: Date,
      refundAmount: Number,
    },

    // Contract
    contract: {
      signed: { type: Boolean, default: false },
      signedAt: Date,
      documentUrl: String,
      terms: String,
    },

    // Status
    status: {
      type: String,
      enum: ["reserved", "pending", "confirmed", "in-progress", "completed", "cancelled"],
      default: "reserved",
    },

    // Reservation timeout (for auto-cancel after 5 minutes)
    reservedUntil: {
      type: Date,
    },

    // Cancellation
    cancellation: {
      reason: String,
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      cancelledAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Generate booking number before saving
bookingSchema.pre("save", async function (next) {
  if (!this.bookingNumber) {
    const count = await mongoose.model("Booking").countDocuments();
    this.bookingNumber = `BK${Date.now()}${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
