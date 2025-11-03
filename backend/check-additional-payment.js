const mongoose = require("mongoose");
const Booking = require("./models/Booking");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/ev-rental", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const checkAdditionalPayments = async () => {
  try {
    console.log("🔍 Checking bookings with additional payments...\n");
    
    const bookings = await Booking.find({
      "additionalPayment": { $exists: true }
    })
    .select("_id bookingCode status additionalPayment depositRefund")
    .sort({ updatedAt: -1 })
    .limit(5);

    if (bookings.length === 0) {
      console.log("❌ No bookings with additionalPayment found");
      process.exit(0);
    }

    bookings.forEach((booking, index) => {
      console.log(`\n📋 Booking ${index + 1}:`);
      console.log(`   ID: ${booking._id}`);
      console.log(`   Code: ${booking.bookingCode}`);
      console.log(`   Status: ${booking.status}`);
      
      if (booking.additionalPayment) {
        console.log(`   📝 Additional Payment:`);
        console.log(`      Amount: ${booking.additionalPayment.amount}đ`);
        console.log(`      Status: ${booking.additionalPayment.status}`);
        console.log(`      Method: ${booking.additionalPayment.method || 'N/A'}`);
        console.log(`      OrderId: ${booking.additionalPayment.orderId || '❌ NOT SET'}`);
        console.log(`      TransactionId: ${booking.additionalPayment.transactionId || 'N/A'}`);
        console.log(`      PaidAt: ${booking.additionalPayment.paidAt || 'N/A'}`);
      }
    });

    console.log("\n✅ Check complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

checkAdditionalPayments();
