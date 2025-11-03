const mongoose = require("mongoose");
const Booking = require("./models/Booking");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/ev-rental", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const checkBooking = async () => {
  try {
    console.log("🔍 Checking recent pending_return and refund_pending bookings...\n");
    
    const bookings = await Booking.find({
      status: { $in: ["pending_return", "refund_pending"] }
    })
    .populate("vehicle", "name licensePlate")
    .populate("renter", "fullName email")
    .sort({ updatedAt: -1 })
    .limit(5);

    if (bookings.length === 0) {
      console.log("❌ No pending_return or refund_pending bookings found");
      process.exit(0);
    }

    bookings.forEach((booking, index) => {
      console.log(`\n📋 Booking ${index + 1}:`);
      console.log(`   ID: ${booking._id}`);
      console.log(`   Booking Code: ${booking.bookingCode}`);
      console.log(`   Status: ${booking.status}`);
      console.log(`   Renter: ${booking.renter?.fullName || 'N/A'}`);
      console.log(`   Vehicle: ${booking.vehicle?.name || 'N/A'} (${booking.vehicle?.licensePlate || 'N/A'})`);
      console.log(`   Updated At: ${booking.updatedAt}`);
      
      if (booking.returnRequest) {
        console.log(`   📅 Return Request: ${new Date(booking.returnRequest.requestedAt).toLocaleString()}`);
      }
      
      if (booking.pricing?.additionalCharges?.length > 0) {
        console.log(`   💰 Additional Charges:`);
        booking.pricing.additionalCharges.forEach(charge => {
          console.log(`      - ${charge.type}: ${charge.amount}đ (${charge.description})`);
        });
      }
      
      if (booking.additionalPayment) {
        console.log(`   💳 Additional Payment:`);
        console.log(`      Amount: ${booking.additionalPayment.amount}đ`);
        console.log(`      Status: ${booking.additionalPayment.status}`);
        console.log(`      Method: ${booking.additionalPayment.method}`);
        console.log(`      Order ID: ${booking.additionalPayment.orderId || 'N/A'}`);
      }
      
      if (booking.depositRefund) {
        console.log(`   💸 Deposit Refund:`);
        console.log(`      Amount: ${booking.depositRefund.amount}đ`);
        console.log(`      Status: ${booking.depositRefund.status}`);
        console.log(`      Method: ${booking.depositRefund.method}`);
      }
    });

    console.log("\n✅ Check complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkBooking();
