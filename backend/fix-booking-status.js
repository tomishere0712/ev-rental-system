/**
 * Script để fix booking có additionalPayment.status = "pending" 
 * nhưng booking.status = "refund_pending" về đúng trạng thái "pending_return"
 */

const mongoose = require("mongoose");
require("dotenv").config();

const Booking = require("./models/Booking");

async function fixBookingStatus() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find bookings with wrong status
    const wrongBookings = await Booking.find({
      status: "refund_pending",
      "additionalPayment.status": "pending",
    });

    console.log(`\n📊 Found ${wrongBookings.length} booking(s) with wrong status\n`);

    if (wrongBookings.length === 0) {
      console.log("✅ No bookings to fix!");
      process.exit(0);
    }

    for (const booking of wrongBookings) {
      console.log(`\n🔧 Fixing booking: ${booking.bookingNumber}`);
      console.log(`   Current status: ${booking.status}`);
      console.log(`   Additional payment status: ${booking.additionalPayment.status}`);
      console.log(`   Additional payment amount: ${booking.additionalPayment.amount}đ`);

      // Update to correct status
      booking.status = "pending_return";
      
      // Update depositRefund status if needed
      if (booking.depositRefund && booking.depositRefund.status !== "pending_payment") {
        booking.depositRefund.status = "pending_payment";
        console.log(`   ✓ Updated depositRefund.status to "pending_payment"`);
      }

      await booking.save();
      console.log(`   ✅ Updated booking status to "pending_return"`);
    }

    console.log(`\n✅ Successfully fixed ${wrongBookings.length} booking(s)!`);
    console.log("\n💡 Customers can now proceed to pay additional charges via VNPAY");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the script
fixBookingStatus();
