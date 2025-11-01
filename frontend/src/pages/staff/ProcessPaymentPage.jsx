import { useState } from "react";
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
} from "lucide-react";

const ProcessPaymentPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paidAmount, setPaidAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentSummary, setPaymentSummary] = useState(null);

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
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <DollarSign className="w-6 h-6" />
                  Payment Summary
                </h2>
              </div>

              <div className="p-6 space-y-4">
                {/* Cost Breakdown */}
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Base Amount</span>
                    <span className="font-semibold">
                      $
                      {paymentSummary.baseAmount?.toFixed(2) ||
                        booking.totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Deposit</span>
                    <span className="font-semibold">
                      ${booking.deposit.toFixed(2)}
                    </span>
                  </div>
                  {paymentSummary.lateFees > 0 && (
                    <div className="flex justify-between py-2 border-b text-orange-600">
                      <span>Late Fees</span>
                      <span className="font-semibold">
                        +${paymentSummary.lateFees.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {paymentSummary.damageFees > 0 && (
                    <div className="flex justify-between py-2 border-b text-red-600">
                      <span>Damage Fees</span>
                      <span className="font-semibold">
                        +${paymentSummary.damageFees.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Total Paid</span>
                    <span className="font-semibold text-green-600">
                      ${paymentSummary.totalPaid.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Total Amount Due */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">
                      Amount Due
                    </span>
                    <span className="text-3xl font-bold text-blue-600">
                      ${paymentSummary.amountDue.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${getPaymentStatusBadge(
                        paymentSummary.paymentStatus
                      )}`}
                    >
                      {paymentSummary.paymentStatus.toUpperCase()}
                    </span>
                  </div>
                </div>

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
                                  "en-GB"
                                )}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-green-600">
                              ${payment.amount.toFixed(2)}
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
                    Process New Payment
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

      {/* Help Text */}
      {!booking && !error && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-blue-800">
            Search for a booking using the booking number or customer email to
            process payment.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProcessPaymentPage;
