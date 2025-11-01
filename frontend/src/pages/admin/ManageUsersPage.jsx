import { useState, useEffect } from "react";
import { adminService } from "../../services";
import { Users, Search, AlertTriangle, Ban, Shield, Eye } from "lucide-react";

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (userId) => {
    try {
      const userData = await adminService.getUserById(userId);
      setSelectedUser(userData);
      setShowDetailsModal(true);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to fetch user details");
    }
  };

  const handleUpdateRiskLevel = async (userId, riskLevel) => {
    try {
      await adminService.updateUserRiskLevel(userId, riskLevel);
      alert("Risk level updated successfully!");
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update risk level");
    }
  };

  const handleBlockUser = async (userId) => {
    if (!confirm("Are you sure you want to block/unblock this user?")) return;

    try {
      await adminService.blockUser(userId);
      alert("User status updated successfully!");
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update user status");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery);
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRiskBadge = (riskLevel) => {
    const badges = {
      low: "bg-green-100 text-green-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
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
          <div className="w-full md:w-48">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="renter">Renters</option>
              <option value="staff">Staff</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Renters</p>
          <p className="text-2xl font-bold text-blue-600">
            {users.filter((u) => u.role === "renter").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">Staff</p>
          <p className="text-2xl font-bold text-green-600">
            {users.filter((u) => u.role === "staff").length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4">
          <p className="text-sm text-gray-600">High Risk</p>
          <p className="text-2xl font-bold text-red-600">
            {
              users.filter(
                (u) => u.riskLevel === "high" || u.riskLevel === "critical"
              ).length
            }
          </p>
        </div>
      </div>

      {/* Users Table */}
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
                      className={`px-3 py-1 rounded-full text-xs font-semibold border-0 cursor-pointer ${getRiskBadge(
                        user.riskLevel
                      )}`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {user.isBlocked ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        Blocked
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
                      <button
                        onClick={() => handleBlockUser(user._id)}
                        className={`p-2 rounded ${
                          user.isBlocked
                            ? "text-green-600 hover:bg-green-50"
                            : "text-red-600 hover:bg-red-50"
                        }`}
                        title={user.isBlocked ? "Unblock User" : "Block User"}
                      >
                        {user.isBlocked ? (
                          <Shield className="w-4 h-4" />
                        ) : (
                          <Ban className="w-4 h-4" />
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

      {/* User Details Modal */}
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

              {/* Booking History */}
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
