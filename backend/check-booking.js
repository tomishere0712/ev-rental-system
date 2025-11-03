/**
 * Script để check booking status
 */

const mongoose = require("mongoose");
require("dotenv").config();

const Booking = require("./models/Booking");

async function checkBooking() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find the specific booking
    const booking = await Booking.findOne({
      bookingNumber: "BK17621024931020008"
    });

    if (!booking) {
      console.log("❌ Booking not found!");
      process.exit(0);
    }

    console.log("\n📊 Booking Details:");
    console.log("   Booking Number:", booking.bookingNumber);
    console.log("   Status:", booking.status);
    console.log("\n💰 Additional Payment:");
    console.log(JSON.stringify(booking.additionalPayment, null, 2));
    console.log("\n💵 Deposit Refund:");
    console.log(JSON.stringify(booking.depositRefund, null, 2));

    // Fix the booking
    if (booking.status === "refund_pending" && booking.additionalPayment) {
      console.log("\n🔧 Fixing booking...");
      
      // Check if additionalPayment is already completed (old "paid" status)
      if (booking.additionalPayment.status === "paid" || booking.additionalPayment.transactionId) {
        console.log("   ✓ Additional payment already completed, no need to fix");
        console.log("   ✓ Booking should stay in refund_pending status");
      } else if (booking.additionalPayment.status === "pending") {
        // Need to pay via VNPAY
        console.log("   ✓ Additional payment still pending");
        booking.status = "pending_return";
        
        if (booking.depositRefund) {
          booking.depositRefund.status = "pending_payment";
        }
        
        await booking.save();
        console.log("   ✅ Booking fixed to pending_return!");
        
        console.log("\n📊 Updated Booking:");
        console.log("   Status:", booking.status);
        console.log("   DepositRefund.status:", booking.depositRefund?.status);
      }
    } else {
      console.log("\n✅ Booking is in correct status");
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the script
checkBooking();
