const cron = require('node-cron');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');

/**
 * Kiểm tra và tự động hủy các booking "reserved" đã hết hạn 5 phút
 * Chạy mỗi 1 phút
 */
const checkExpiredReservations = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      
      // Tìm các booking có status = "reserved" và đã hết hạn reservedUntil
      const expiredBookings = await Booking.find({
        status: 'reserved',
        reservedUntil: { $lt: now }
      }).populate('vehicle');

      if (expiredBookings.length > 0) {
        console.log(`⏰ [${now.toLocaleString('vi-VN')}] Found ${expiredBookings.length} expired reservations. Auto-cancelling...`);
        
        for (const booking of expiredBookings) {
          console.log(`   - Booking ${booking.bookingNumber}: Reserved until ${booking.reservedUntil.toLocaleString('vi-VN')}`);
          
          // Cancel booking
          booking.status = 'cancelled';
          booking.cancellation = {
            reason: 'Hết thời gian giữ chỗ (5 phút) - Chưa thanh toán',
            cancelledAt: now,
          };
          await booking.save();
          
          // Trả xe về trạng thái available
          await Vehicle.findByIdAndUpdate(booking.vehicle._id, { status: 'available' });
          
          console.log(`   ❌ Auto-cancelled booking: ${booking.bookingNumber}`);
          console.log(`   ✅ Vehicle ${booking.vehicle.name} returned to available`);
        }
      }
    } catch (error) {
      console.error('❌ Error checking expired reservations:', error);
    }
  });

  console.log('✅ Booking reservation scheduler started - Checking every 1 minute');
};

module.exports = { checkExpiredReservations };
