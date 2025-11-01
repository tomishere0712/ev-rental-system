const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // Payment Reference
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },

    // Related Booking
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    // Payer
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Payment Type
    type: {
      type: String,
      enum: ["deposit", "rental", "additional", "refund"],
      required: true,
    },

    // Amount
    amount: {
      type: Number,
      required: true,
    },

    // Payment Method
    method: {
      type: String,
      enum: ["cash", "card", "bank-transfer", "e-wallet", "online"],
      required: true,
    },

    // Payment Status
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },

    // Payment Details
    details: {
      cardNumber: String, // Last 4 digits only
      bankName: String,
      walletType: String, // Momo, ZaloPay, etc.
      referenceNumber: String,
    },

    // Station (if paid at station)
    station: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Station",
    },

    // Staff who processed (if at station)
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Timestamps
    paidAt: Date,
    refundedAt: Date,

    // Notes
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Generate transaction ID before saving
paymentSchema.pre("save", async function (next) {
  if (!this.transactionId) {
    this.transactionId = `TXN${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model("Payment", paymentSchema);
