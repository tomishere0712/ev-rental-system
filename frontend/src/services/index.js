import api from "../lib/api";

// Auth Services
export const authService = {
  register: async (data) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  uploadDocuments: async (formData) => {
    const response = await api.post("/auth/upload-documents", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put("/auth/profile", data);
    return response.data;
  },
};

// Station Services
export const stationService = {
  getAll: async () => {
    const response = await api.get("/stations");
    return response.data;
  },

  getStations: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/stations?${queryString}` : "/stations";
    const response = await api.get(url);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/stations/${id}`);
    return response.data;
  },

  getVehicles: async (id, status = "available") => {
    const response = await api.get(`/stations/${id}/vehicles?status=${status}`);
    return response.data;
  },

  searchNearby: async ({ latitude, longitude, maxDistance = 5000 }) => {
    const response = await api.get(
      `/stations/search/nearby?lat=${latitude}&lng=${longitude}&maxDistance=${maxDistance}`
    );
    return response.data;
  },
};

// Vehicle Services
export const vehicleService = {
  getAll: async (params) => {
    const response = await api.get("/vehicles", { params });
    return response.data;
  },

  getVehicles: async (params = {}) => {
    const response = await api.get("/vehicles", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  },

  searchNearby: async (lat, lng, radius) => {
    const response = await api.get(
      `/vehicles/search/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
    );
    return response.data;
  },
};

// Booking Services
export const bookingService = {
  create: async (data) => {
    const response = await api.post("/bookings", data);
    return response.data;
  },

  getMyBookings: async (params) => {
    const response = await api.get("/bookings", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  cancel: async (id, reason) => {
    const response = await api.put(`/bookings/${id}/cancel`, { reason });
    return response.data;
  },

  signContract: async (id, signature) => {
    const response = await api.post(`/bookings/${id}/sign-contract`, {
      signature,
    });
    return response.data;
  },

  getRentalHistory: async () => {
    const response = await api.get("/bookings/history/analytics");
    return response.data;
  },
};

// Payment Services
export const paymentService = {
  process: async (data) => {
    const response = await api.post("/payments", data);
    return response.data;
  },

  getHistory: async (params) => {
    const response = await api.get("/payments", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },
};

// Staff Services
export const staffService = {
  getStats: async () => {
    const response = await api.get("/staff/stats");
    return response.data;
  },

  getBookings: async (params) => {
    const response = await api.get("/staff/bookings", { params });
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await api.get(`/staff/bookings/${id}`);
    return response.data;
  },

  verifyCustomer: async (id, data) => {
    const response = await api.put(`/staff/bookings/${id}/verify`, data);
    return response.data;
  },

  handoverVehicle: async (id, data) => {
    const response = await api.put(`/staff/bookings/${id}/handover`, data);
    return response.data;
  },

  returnVehicle: async (id, data) => {
    const response = await api.put(`/staff/bookings/${id}/return`, data);
    return response.data;
  },

  getVehicles: async (params) => {
    const response = await api.get("/staff/vehicles", { params });
    return response.data;
  },

  updateBattery: async (id, batteryLevel) => {
    const response = await api.put(`/staff/vehicles/${id}/battery`, {
      batteryLevel,
    });
    return response.data;
  },

  reportIssue: async (id, data) => {
    const response = await api.post(`/staff/vehicles/${id}/issue`, data);
    return response.data;
  },

  updateVehicleStatus: async (id, status) => {
    const response = await api.put(`/staff/vehicles/${id}/status`, { status });
    return response.data;
  },

  getPaymentSummary: async (id) => {
    const response = await api.get(`/staff/bookings/${id}/payment`);
    return response.data;
  },

  processPayment: async (data) => {
    const response = await api.post("/staff/payments", data);
    return response.data;
  },

  // 🆕 Verifications
  getPendingVerifications: async () => {
    const response = await api.get("/staff/verifications/pending");
    return response.data;
  },

  verifyUserDocuments: async (userId, data) => {
    const response = await api.patch(`/staff/verifications/${userId}`, data);
    return response.data;
  },
  getApprovedVerifications: async () => {
    const response = await api.get("/staff/verifications/approved");
    return response.data;
  },

  getRejectedVerifications: async () => {
    const response = await api.get("/staff/verifications/rejected");
    return response.data;
  },

};

// Admin Services
export const adminService = {
  // Dashboard Stats
  getOverviewStats: async () => {
    const response = await api.get("/admin/stats/overview");
    return response.data;
  },

  getRevenueByStation: async () => {
    const response = await api.get("/admin/stats/revenue-by-station");
    return response.data;
  },

  getBookingsTrend: async () => {
    const response = await api.get("/admin/stats/bookings-trend");
    return response.data;
  },

  getVehicleDistribution: async () => {
    const response = await api.get("/admin/stats/vehicle-distribution");
    return response.data;
  },

  // Vehicles
  getVehicles: async (params) => {
    const response = await api.get("/admin/vehicles", { params });
    return response.data;
  },

  createVehicle: async (data) => {
    const response = await api.post("/admin/vehicles", data);
    return response.data;
  },

  updateVehicle: async (id, data) => {
    const response = await api.put(`/admin/vehicles/${id}`, data);
    return response.data;
  },

  deleteVehicle: async (id) => {
    const response = await api.delete(`/admin/vehicles/${id}`);
    return response.data;
  },

  transferVehicle: async (id, stationId) => {
    const response = await api.put(`/admin/vehicles/${id}/transfer`, {
      stationId,
    });
    return response.data;
  },

  // Stations
  getStations: async () => {
    const response = await api.get("/admin/stations");
    return response.data;
  },

  createStation: async (data) => {
    const response = await api.post("/admin/stations", data);
    return response.data;
  },

  updateStation: async (id, data) => {
    const response = await api.put(`/admin/stations/${id}`, data);
    return response.data;
  },

  deleteStation: async (id) => {
    const response = await api.delete(`/admin/stations/${id}`);
    return response.data;
  },

  // Users
  getUsers: async (params) => {
    const response = await api.get("/admin/users", { params });
    return response.data;
  },

  getUserById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUserRiskLevel: async (id, data) => {
    const response = await api.put(`/admin/users/${id}/risk-level`, data);
    return response.data;
  },

  blockUser: async (id, isActive) => {
    const response = await api.put(`/admin/users/${id}/block`, { isActive });
    return response.data;
  },

  // Staff
  getStaff: async () => {
    const response = await api.get("/admin/staff");
    return response.data;
  },

  createStaff: async (data) => {
    const response = await api.post("/admin/staff", data);
    return response.data;
  },

  updateStaff: async (id, data) => {
    const response = await api.put(`/admin/staff/${id}`, data);
    return response.data;
  },

  deleteStaff: async (id) => {
    const response = await api.delete(`/admin/staff/${id}`);
    return response.data;
  },

  getStaffPerformance: async (id) => {
    const response = await api.get(`/admin/staff/${id}/performance`);
    return response.data;
  },
};
