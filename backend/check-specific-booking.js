const mongoose = require("mongoose");
const Booking = require("./models/Booking");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/ev-rental", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const checkBooking = async () => {
  try {
    const bookingCode = "BK17621349246960001";
    console.log(`🔍 Checking booking: ${bookingCode}\n`);
    
    const booking = await Booking.findOne({ bookingCode })
      .populate("vehicle", "name licensePlate")
      .populate("renter", "fullName email");

    if (!booking) {
      console.log("❌ Booking not found");
      process.exit(0);
    }

    console.log(`📋 Booking Details:`);
    console.log(`   ID: ${booking._id}`);
    console.log(`   Code: ${booking.bookingCode}`);
    console.log(`   Status: ${booking.status}`);
    console.log(`   Renter: ${booking.renter?.fullName || 'N/A'}`);
    console.log(`   Vehicle: ${booking.vehicle?.name || 'N/A'}`);
    console.log(`   Updated At: ${booking.updatedAt}`);
    
    if (booking.pricing) {
      console.log(`\n💰 Pricing:`);
      console.log(`   Deposit: ${booking.pricing.deposit}đ`);
      if (booking.pricing.additionalCharges?.length > 0) {
        console.log(`   Additional Charges:`);
        booking.pricing.additionalCharges.forEach(charge => {
          console.log(`      - ${charge.type}: ${charge.amount}đ (${charge.description})`);
        });
      }
    }
    
    if (booking.additionalPayment) {
      console.log(`\n💳 Additional Payment:`);
      console.log(`   Amount: ${booking.additionalPayment.amount}đ`);
      console.log(`   Status: ${booking.additionalPayment.status}`);
      console.log(`   Method: ${booking.additionalPayment.method}`);
      console.log(`   Notes: ${booking.additionalPayment.notes || 'N/A'}`);
    }
    
    if (booking.depositRefund) {
      console.log(`\n💸 Deposit Refund:`);
      console.log(`   Amount: ${booking.depositRefund.amount}đ`);
      console.log(`   Status: ${booking.depositRefund.status}`);
      console.log(`   Method: ${booking.depositRefund.method}`);
      console.log(`   Notes: ${booking.depositRefund.notes || 'N/A'}`);
    }

    console.log("\n✅ Check complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkBooking();
