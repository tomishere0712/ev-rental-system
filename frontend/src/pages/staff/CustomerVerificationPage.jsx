import { useState } from "react";
import { staffService } from "../../services";
import {
  Search,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  CreditCard,
  FileText,
} from "lucide-react";

const CustomerVerificationPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError("");
    setBooking(null);

    try {
      const bookings = await staffService.getBookings({ search: searchQuery });
      const foundBooking = bookings.find(
        (b) => b.bookingNumber === searchQuery || b.user?.email === searchQuery
      );

      if (foundBooking) {
        setBooking(foundBooking);
      } else {
        setError("No booking found with this booking number or email");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to search booking");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (status) => {
    if (!booking) return;

    setVerifying(true);
    try {
      await staffService.verifyCustomer(booking._id, {
        status,
        notes: verificationNotes,
      });

      alert(
        `Booking ${
          status === "approved" ? "approved" : "rejected"
        } successfully`
      );

      // Reset form
      setSearchQuery("");
      setBooking(null);
      setVerificationNotes("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to verify booking");
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      active: "bg-blue-100 text-blue-800",
      completed: "bg-gray-100 text-gray-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Customer Verification
        </h1>
        <p className="text-gray-600 mt-2">
          Search and verify customer bookings
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

      {/* Booking Details */}
      {booking && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <h2 className="text-xl font-semibold text-white">
              Booking Details
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <span className="text-gray-600 font-medium">Status:</span>
              <span
                className={`px-4 py-1 rounded-full text-sm font-semibold ${getStatusBadge(
                  booking.status
                )}`}
              >
                {booking.status.toUpperCase()}
              </span>
            </div>

            {/* Customer Information */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Customer Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="text-base font-medium text-gray-900">
                    {booking.user?.fullName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-base font-medium text-gray-900">
                    {booking.user?.email || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="text-base font-medium text-gray-900">
                    {booking.user?.phone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">License Number</p>
                  <p className="text-base font-medium text-gray-900">
                    {booking.user?.licenseNumber || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Information */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Booking Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Booking Number</p>
                  <p className="text-base font-medium text-gray-900">
                    {booking.bookingNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vehicle</p>
                  <p className="text-base font-medium text-gray-900">
                    {booking.vehicle?.brand} {booking.vehicle?.model}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Start Date</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(booking.startDate).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">End Date</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(booking.endDate).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pickup Station</p>
                  <p className="text-base font-medium text-gray-900">
                    {booking.pickupStation?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Return Station</p>
                  <p className="text-base font-medium text-gray-900">
                    {booking.returnStation?.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Payment Information
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${booking.totalAmount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Deposit</p>
                  <p className="text-xl font-semibold text-blue-600">
                    ${booking.deposit}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Notes */}
            <div className="border-t pt-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Verification Notes
                </h3>
              </div>
              <textarea
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Add notes about the verification process..."
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            {booking.status === "pending" && (
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => handleVerify("approved")}
                  disabled={verifying}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve Booking
                </button>
                <button
                  onClick={() => handleVerify("rejected")}
                  disabled={verifying}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Reject Booking
                </button>
              </div>
            )}

            {booking.status !== "pending" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">
                  This booking has already been {booking.status}. No further
                  action needed.
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
            view details and verify.
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerVerificationPage;
