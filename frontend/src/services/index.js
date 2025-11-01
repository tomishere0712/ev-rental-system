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
