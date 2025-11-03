import { useState, useEffect } from "react";
import { staffService } from "../../services";
import {
  Search,
  CreditCard,
  DollarSign,
  FileText,
  Calendar,
  User,
  Car,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";

const ProcessPaymentPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [bookings, setBookings] = useState([]);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentSummary, setPaymentSummary] = useState(null);

  // Load bookings that need payment on mount
  useEffect(() => {
    fetchPaymentPendingBookings();
  }, []);

  const fetchPaymentPendingBookings = async () => {
    try {
      setLoading(true);
      console.log("📋 Loading bookings that need payment...");
      const response = await staffService.getBookings({ 
        status: "confirmed,refund_pending" // Both rental payment and refund processing
      });
      
      const bookingsList = response.data || response || [];
      console.log("✅ Loaded", bookingsList.length, "bookings");
      setBookings(bookingsList);
    } catch (error) {
      console.error("❌ Error loading bookings:", error);
      toast.error("Không thể tải danh sách booking");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setBooking(null);
    setPaymentSummary(null);

    try {
      const bookings = await staffService.getBookings({ search: searchQuery });
      const foundBooking = bookings.find(
        (b) => b.bookingNumber === searchQuery || b.user?.email === searchQuery
      );

      if (foundBooking) {
        setBooking(foundBooking);

        // Fetch payment summary
        const summary = await staffService.getPaymentSummary(foundBooking._id);
        setPaymentSummary(summary);

        // Pre-fill amount due
        if (summary.amountDue > 0) {
          setPaidAmount(summary.amountDue.toString());
        }
      } else {
        setError("No booking found with this booking number or email");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to search booking");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    if (!booking || !paidAmount) {
      alert("Please enter the payment amount");
      return;
    }

    const amount = parseFloat(paidAmount);
    if (amount <= 0) {
      alert("Payment amount must be greater than 0");
      return;
    }

    setProcessing(true);
    try {
      await staffService.processPayment(booking._id, {
        amount,
        method: paymentMethod,
        notes: paymentNotes,
      });

      alert("Payment processed successfully!");

      // Reset form
      setSearchQuery("");
      setBooking(null);
      setPaymentSummary(null);
      setPaidAmount("");
      setPaymentNotes("");
      setPaymentMethod("cash");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to process payment");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      active: "bg-blue-100 text-blue-800",
      completed: "bg-gray-100 text-gray-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      partial: "bg-orange-100 text-orange-800",
      paid: "bg-green-100 text-green-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Process Payment</h1>
        <p className="text-gray-600 mt-2">
          Handle rental payments and generate receipts
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Tìm kiếm booking</h2>
          {booking && (
            <button
              onClick={() => {
                setBooking(null);
                setPaymentSummary(null);
                setSearchQuery("");
                setPaidAmount("");
                setPaymentNotes("");
                setError("");
              }}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại danh sách
            </button>
          )}
        </div>
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter booking number or customer email..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Booking and Payment Details */}
      {booking && paymentSummary && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Customer
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">Name:</span>{" "}
                  <span className="font-medium">{booking.user?.fullName}</span>
                </p>
                <p>
                  <span className="text-gray-600">Email:</span>{" "}
                  <span className="font-medium">{booking.user?.email}</span>
                </p>
                <p>
                  <span className="text-gray-600">Phone:</span>{" "}
                  <span className="font-medium">{booking.user?.phone}</span>
                </p>
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <Car className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Vehicle</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">Model:</span>{" "}
                  <span className="font-medium">
                    {booking.vehicle?.brand} {booking.vehicle?.model}
                  </span>
                </p>
                <p>
                  <span className="text-gray-600">License:</span>{" "}
                  <span className="font-medium">
                    {booking.vehicle?.licensePlate}
                  </span>
                </p>
              </div>
            </div>

            {/* Booking Info */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Booking</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600">Number:</span>{" "}
                  <span className="font-medium">{booking.bookingNumber}</span>
                </p>
                <p>
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`ml-2 px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>
                </p>
                <p>
                  <span className="text-gray-600">Dates:</span>{" "}
                  <span className="font-medium">
                    {new Date(booking.startDate).toLocaleDateString("en-GB")} -{" "}
                    {new Date(booking.endDate).toLocaleDateString("en-GB")}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Summary & Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className={`px-6 py-4 ${paymentSummary.isRefund ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-green-500 to-green-600'}`}>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  {paymentSummary.isRefund ? 'Thông tin hoàn tiền' : 'Payment Summary'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {paymentSummary.isRefund ? (
                  /* Refund Case */
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Tiền cọc ban đầu</span>
                      <span className="font-semibold">
                        {paymentSummary.deposit?.toLocaleString()}đ
                      </span>
                    </div>
                    {paymentSummary.additionalCharges > 0 && (
                      <div className="flex justify-between py-2 border-b text-red-600">
                        <span>Chi phí phát sinh</span>
                        <span className="font-semibold">
                          -{paymentSummary.additionalCharges?.toLocaleString()}đ
                        </span>
                      </div>
                    )}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">
                          Số tiền hoàn lại
                        </span>
                        <span className="text-3xl font-bold text-green-600">
                          {paymentSummary.refundAmount?.toLocaleString()}đ
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        💡 Nhập thông tin chuyển khoản bên dưới
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Normal Payment Case */
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Base Amount</span>
                      <span className="font-semibold">
                        {paymentSummary.baseAmount?.toLocaleString() ||
                          booking.pricing?.totalAmount?.toLocaleString()}đ
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Deposit</span>
                      <span className="font-semibold">
                        {booking.pricing?.deposit?.toLocaleString()}đ
                      </span>
                    </div>
                    {paymentSummary.lateFees > 0 && (
                      <div className="flex justify-between py-2 border-b text-orange-600">
                        <span>Late Fees</span>
                        <span className="font-semibold">
                          +{paymentSummary.lateFees?.toLocaleString()}đ
                        </span>
                      </div>
                    )}
                    {paymentSummary.damageFees > 0 && (
                      <div className="flex justify-between py-2 border-b text-red-600">
                        <span>Damage Fees</span>
                        <span className="font-semibold">
                          +{paymentSummary.damageFees?.toLocaleString()}đ
                        </span>
                      </div>
                    )}
                    {paymentSummary.totalPaid > 0 && (
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-gray-600">Total Paid</span>
                        <span className="font-semibold text-green-600">
                          {paymentSummary.totalPaid?.toLocaleString()}đ
                        </span>
                      </div>
                    )}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">
                          Amount Due
                        </span>
                        <span className="text-3xl font-bold text-blue-600">
                          {paymentSummary.amountDue?.toLocaleString()}đ
                        </span>
                      </div>
                      {paymentSummary.paymentStatus && (
                        <div className="mt-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${getPaymentStatusBadge(
                              paymentSummary.paymentStatus
                            )}`}
                          >
                            {paymentSummary.paymentStatus.toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment History */}
                {paymentSummary.payments &&
                  paymentSummary.payments.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-900 mb-3">
                        Payment History
                      </h4>
                      <div className="space-y-2">
                        {paymentSummary.payments.map((payment, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded"
                          >
                            <div>
                              <span className="text-sm font-medium">
                                {payment.method}
                              </span>
                              <span className="text-xs text-gray-600 ml-2">
                                {new Date(payment.createdAt).toLocaleDateString(
                                  "vi-VN"
                                )}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-green-600">
                              {payment.amount?.toLocaleString()}đ
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* Payment Form */}
            {paymentSummary.amountDue > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {paymentSummary.isRefund ? 'Xử lý hoàn tiền' : 'Process New Payment'}
                  </h3>
                </div>

                <div className="space-y-4">
                  {/* Payment Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-lg">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Credit/Debit Card</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="e_wallet">E-Wallet</option>
                    </select>
                  </div>

                  {/* Payment Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FileText className="w-4 h-4 inline mr-1" />
                      Notes (Optional)
                    </label>
                    <textarea
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Add any notes about this payment..."
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleProcessPayment}
                    disabled={processing || !paidAmount}
                    className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 text-lg font-semibold"
                  >
                    <CheckCircle className="w-6 h-6" />
                    {processing
                      ? "Processing..."
                      : `Process Payment $${paidAmount || "0.00"}`}
                  </button>
                </div>
              </div>
            )}

            {paymentSummary.amountDue <= 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <p className="text-lg font-semibold text-green-800">
                  Payment Complete!
                </p>
                <p className="text-green-700 mt-2">
                  This booking has been fully paid.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Help Text or Bookings List */}
      {!booking && !error && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Chờ thu tiền</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {bookings.filter(b => b.status === "confirmed" && b.payment?.status !== "paid").length}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Cần hoàn cọc</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {bookings.filter(b => {
                      if (b.status !== "refund_pending") return false;
                      const deposit = b.pricing?.deposit || 0;
                      const additionalCharges = b.pricing?.additionalCharges?.reduce((sum, c) => sum + c.amount, 0) || 0;
                      return additionalCharges <= deposit;
                    }).length}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Chờ khách trả thêm</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {bookings.filter(b => {
                      if (b.status !== "refund_pending") return false;
                      const deposit = b.pricing?.deposit || 0;
                      const additionalCharges = b.pricing?.additionalCharges?.reduce((sum, c) => sum + c.amount, 0) || 0;
                      return additionalCharges > deposit;
                    }).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-orange-600" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Tổng booking</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookings.length}
                  </p>
                </div>
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          </div>

          {/* Bookings List */}
          {bookings.length === 0 ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-12 text-center">
              <CreditCard className="w-16 h-16 text-blue-300 mx-auto mb-4" />
              <p className="text-xl font-semibold text-blue-900 mb-2">
                Không có booking nào cần thanh toán
              </p>
              <p className="text-blue-700">
                Tất cả booking đã được thanh toán hoặc chưa có booking mới
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  Danh sách booking cần xử lý thanh toán
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Click vào booking để xem chi tiết và xử lý thanh toán
                </p>
              </div>
              <div className="divide-y">
                {bookings.map((b) => {
                  // Calculate if this is a refund case
                  const isRefundCase = b.status === "refund_pending";
                  const deposit = b.pricing?.deposit || 0;
                  const additionalCharges = b.pricing?.additionalCharges?.reduce((sum, c) => sum + c.amount, 0) || 0;
                  const requiresCustomerPayment = additionalCharges > deposit;
                  const refundAmount = b.depositRefund?.amount || 0;
                  
                  // Determine status badge and action
                  let statusBadge, statusText, actionType;
                  
                  if (isRefundCase) {
                    if (requiresCustomerPayment) {
                      // Case: Additional charges > deposit, waiting for customer to pay via VNPAY
                      statusBadge = "bg-orange-100 text-orange-800";
                      statusText = "⏳ Chờ khách thanh toán bổ sung";
                      actionType = "waiting";
                    } else {
                      // Case: Additional charges <= deposit, staff needs to refund
                      statusBadge = "bg-yellow-100 text-yellow-800";
                      statusText = "💰 Cần hoàn tiền cọc";
                      actionType = "refund";
                    }
                  } else {
                    // Case: Normal payment (confirmed booking)
                    statusBadge = b.payment?.status === "paid" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800";
                    statusText = b.payment?.status === "paid" ? "✅ Đã thanh toán" : "💳 Chờ thanh toán";
                    actionType = "payment";
                  }

                  return (
                    <div
                      key={b._id}
                      onClick={async () => {
                        if (actionType === "waiting") {
                          // Don't allow clicking if waiting for customer payment
                          toast.info("Đang chờ khách hàng thanh toán chi phí phát sinh qua VNPAY");
                          return;
                        }
                        
                        if (actionType === "refund") {
                          // Redirect to refund management page for refund cases
                          window.location.href = "/staff/refund";
                          return;
                        }
                        
                        try {
                          setLoading(true);
                          setBooking(b);
                          
                          // For normal payment case
                          const summary = await staffService.getPaymentSummary(b._id);
                          setPaymentSummary(summary);
                          if (summary.amountDue > 0) {
                            setPaidAmount(summary.amountDue.toString());
                          }
                          
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } catch (err) {
                          console.error("Error loading payment info:", err);
                          toast.error("Không thể tải thông tin thanh toán");
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className={`p-6 transition-colors ${
                        actionType === "waiting" 
                          ? "bg-orange-50 cursor-not-allowed opacity-75" 
                          : "hover:bg-gray-50 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-bold text-gray-900">
                              {b.bookingCode}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge}`}>
                              {statusText}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <User className="w-4 h-4" />
                              <span className="font-medium">
                                {b.renter?.fullName || "N/A"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600">
                              <Car className="w-4 h-4" />
                              <span>
                                {b.vehicle?.name} ({b.vehicle?.licensePlate})
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-gray-600 md:col-span-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(b.startDate).toLocaleDateString("vi-VN")} -{" "}
                                {new Date(b.endDate).toLocaleDateString("vi-VN")}
                              </span>
                            </div>
                          </div>
                          
                          {/* Additional info for refund cases */}
                          {isRefundCase && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-600">Tiền cọc:</span>
                                  <span className="ml-1 font-semibold">{deposit.toLocaleString()}đ</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Chi phí phát sinh:</span>
                                  <span className="ml-1 font-semibold text-red-600">{additionalCharges.toLocaleString()}đ</span>
                                </div>
                              </div>
                              {requiresCustomerPayment && (
                                <p className="text-xs text-orange-700 mt-2 font-medium">
                                  🔔 Khách cần thanh toán thêm {(additionalCharges - deposit).toLocaleString()}đ qua VNPAY
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="ml-4 text-right">
                          {isRefundCase ? (
                            requiresCustomerPayment ? (
                              <>
                                <p className="text-sm text-orange-600 mb-1">Cần thanh toán thêm</p>
                                <p className="text-2xl font-bold text-red-600">
                                  +{(additionalCharges - deposit).toLocaleString()}đ
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-sm text-gray-600 mb-1">Hoàn lại</p>
                                <p className="text-2xl font-bold text-green-600">
                                  {refundAmount.toLocaleString()}đ
                                </p>
                              </>
                            )
                          ) : (
                            <>
                              <p className="text-sm text-gray-600 mb-1">Tổng tiền</p>
                              <p className="text-2xl font-bold text-green-600">
                                {b.pricing?.totalAmount?.toLocaleString()}đ
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProcessPaymentPage;
