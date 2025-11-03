/**
 * Script để xóa additionalPayment empty trong booking pending_return
 */

const mongoose = require("mongoose");
require("dotenv").config();

const Booking = require("./models/Booking");

async function cleanupAdditionalPayment() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Find bookings with empty additionalPayment
    const result = await Booking.updateMany(
      {
        status: "pending_return",
        "additionalPayment.amount": { $exists: false }
      },
      {
        $unset: { additionalPayment: "" }
      }
    );

    console.log(`\n✅ Cleaned up ${result.modifiedCount} booking(s)`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the script
cleanupAdditionalPayment();
