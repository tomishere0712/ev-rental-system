import api from "./api";

export interface Booking {
  _id: string;
  bookingNumber: string;
  renter: any;
  vehicle: any;
  pickupStation: any;
  returnStation: any;
  startDate: string;
  endDate: string;
  status: string;
  pricing: {
    basePrice: number;
    deposit: number;
    totalAmount: number;
  };
  payment: {
    method: string;
    status: string;
    amount: number;
  };
  createdAt: string;
  updatedAt: string;
}

export const bookingService = {
  create: async (data: any) => {
    const response = await api.post("/bookings", data);
    return response.data.data || response.data;
  },

  getMyBookings: async (params?: any) => {
    const response = await api.get("/bookings", { params });
    return response.data.data || response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data.data || response.data;
  },

  cancel: async (id: string, reason: string) => {
    const response = await api.put(`/bookings/${id}/cancel`, { reason });
    return response.data.data || response.data;
  },

  signContract: async (id: string, signature: string) => {
    const response = await api.post(`/bookings/${id}/sign-contract`, {
      signature,
    });
    return response.data.data || response.data;
  },

  checkIn: async (id: string, data: any) => {
    const response = await api.post(`/bookings/${id}/check-in`, data);
    return response.data.data || response.data;
  },

  requestReturn: async (id: string, data: any) => {
    const response = await api.post(`/bookings/${id}/request-return`, data);
    return response.data.data || response.data;
  },

  getRentalHistory: async () => {
    const response = await api.get("/bookings/history/analytics");
    return response.data.data || response.data;
  },
};
