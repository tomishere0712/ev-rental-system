import { useState, useEffect } from "react";
import { adminService } from "../../services";
import {
  Users,
  Search,
  AlertTriangle,
  Ban,
  Shield,
  Eye,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showViolationsModal, setShowViolationsModal] = useState(false);
  const [userViolations, setUserViolations] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllUsers();
      const usersArray =
        res?.data?.users ||
        res?.users ||
        (Array.isArray(res) ? res : null) ||
        [];

      setUsers(Array.isArray(usersArray) ? usersArray : []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (userId) => {
    try {
      const res = await adminService.getUserById(userId);
      // backend returns { success: true, data: { user, bookings, ... } }
      const userObj = res?.data?.user || res?.user || res?.data || res;
      setSelectedUser(userObj);
      setShowDetailsModal(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch user details"
      );
    }
  };

  const handleUpdateRiskLevel = async (userId, riskLevel) => {
    try {
      // service expects an object body; send { riskLevel }
      await adminService.updateUserRiskLevel(userId, { riskLevel });
      toast.success("Risk level updated successfully!");
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update risk level"
      );
    }
  };

  const handleBlockUser = async (userId) => {
    if (!confirm("Are you sure you want to block/unblock this user?")) return;

    try {
      const user = users.find((u) => u._id === userId);
      const newIsActive = user ? !user.isActive : false;

      await adminService.blockUser(userId, newIsActive);
      toast.success("User status updated successfully!");
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update user status"
      );
    }
  };

  const handleViewViolations = (user) => {
    setUserViolations(user);
    setShowViolationsModal(true);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery);
    return matchesSearch;
  });

  const getRiskBadge = (riskLevel) => {
    const badges = {
      low: "bg-gray-100 text-green-500",
      medium: "bg-gray-100 text-yellow-500",
      high: "bg-gray-100 text-red-500",
    };
    return badges[riskLevel] || "bg-gray-100 text-gray-800";
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: "bg-purple-100 text-purple-800",
      staff: "bg-blue-100 text-blue-800",
      renter: "bg-gray-100 text-gray-800",
    };
    return badges[role] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
        <p className="text-gray-600 mt-2">View and manage all system users</p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Total Renter</p>
          <p className="text-2xl font-bold text-blue-700">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {users.filter((u) => u.isActive).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Inactive</p>
          <p className="text-2xl font-bold text-gray-600">
            {users.filter((u) => !u.isActive).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">High Risk</p>
          <p className="text-2xl font-bold text-red-600">
            {users.filter((u) => u.riskLevel === "high").length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Risk Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.fullName}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">
                      {user.phone || "N/A"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user.licenseNumber || "No license"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRoleBadge(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.riskLevel}
                      onChange={(e) =>
                        handleUpdateRiskLevel(user._id, e.target.value)
                      }
                      className={`p-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${getRiskBadge(
                        user.riskLevel
                      )}`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {!user.isActive ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        Inactive
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(user._id)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {user.violationCount > 0 && (
                        <button
                          onClick={() => handleViewViolations(user)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded relative"
                          title="View Violations"
                        >
                          <AlertCircle className="w-4 h-4" />
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {user.violationCount}
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => handleBlockUser(user._id)}
                        className={`p-2 rounded ${
                          user.isActive
                            ? "text-red-600 hover:bg-red-50"
                            : "text-green-600 hover:bg-green-50"
                        }`}
                        title={user.isActive ? "Block User" : "Unblock User"}
                      >
                        {user.isActive ? (
                          <Ban className="w-4 h-4" />
                        ) : (
                          <Shield className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No users found</p>
          </div>
        )}
      </div>

      {showDetailsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold">User Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedUser.fullName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedUser.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedUser.phone || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">License Number</p>
                    <p className="text-base font-medium text-gray-900">
                      {selectedUser.licenseNumber || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRoleBadge(
                        selectedUser.role
                      )}`}
                    >
                      {selectedUser.role}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Risk Level</p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getRiskBadge(
                        selectedUser.riskLevel
                      )}`}
                    >
                      {selectedUser.riskLevel}
                    </span>
                  </div>
                </div>
              </div>

              {selectedUser.bookingHistory &&
                selectedUser.bookingHistory.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">
                      Booking History
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      {selectedUser.bookingHistory
                        .slice(0, 5)
                        .map((booking, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center py-2 border-b last:border-b-0"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {booking.bookingNumber}
                              </p>
                              <p className="text-xs text-gray-600">
                                {new Date(booking.startDate).toLocaleDateString(
                                  "en-GB"
                                )}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${getBookingStatusBadge(
                                booking.status
                              )}`}
                            >
                              {booking.status}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Violations */}
              {selectedUser.violations &&
                selectedUser.violations.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Violations
                    </h4>
                    <div className="bg-red-50 p-4 rounded-lg space-y-2">
                      {selectedUser.violations.map((violation, idx) => (
                        <div
                          key={idx}
                          className="py-2 border-b last:border-b-0"
                        >
                          <p className="text-sm font-medium text-red-800">
                            {violation.type}
                          </p>
                          <p className="text-xs text-red-600">
                            {new Date(violation.date).toLocaleDateString(
                              "en-GB"
                            )}
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            {violation.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="border-t px-6 py-4">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Violations Modal */}
      {showViolationsModal && userViolations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Violation History
              </h3>
              <button
                onClick={() => setShowViolationsModal(false)}
                className="text-white hover:bg-orange-800 rounded-full p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Customer:</p>
                <p className="text-lg font-semibold text-gray-900">
                  {userViolations.fullName}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {userViolations.email}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-gray-600">Risk Level</p>
                    <p className="text-sm font-semibold text-gray-900 uppercase">
                      {userViolations.riskLevel}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Total Violations</p>
                    <p className="text-2xl font-bold text-red-600">
                      {userViolations.violationCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Violations List */}
              {userViolations.violations &&
              userViolations.violations.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Violations:</h4>
                  {userViolations.violations.map((violation, idx) => (
                    <div
                      key={idx}
                      className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-red-900">
                            {violation.type?.replace("_", " ").toUpperCase()}
                          </p>
                          <p className="text-sm text-red-700">
                            {violation.severity?.toUpperCase() || "MEDIUM"}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-2">
                        {violation.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Date:{" "}
                        {new Date(violation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-green-700 font-medium">
                    No violations recorded
                  </p>
                </div>
              )}

              <button
                onClick={() => setShowViolationsModal(false)}
                className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getBookingStatusBadge = (status) => {
  const badges = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    active: "bg-blue-100 text-blue-800",
    completed: "bg-gray-100 text-gray-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return badges[status] || "bg-gray-100 text-gray-800";
};

export default ManageUsersPage;
