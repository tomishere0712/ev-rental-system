import api from "./api";

export interface Vehicle {
  _id: string;
  name: string;
  brand: string;
  model: string;
  type: string;
  licensePlate: string;
  status: string;
  pricePerDay: number;
  batteryCapacity: number;
  range: number;
  images: string[];
  currentStation?: any;
  station?: {
    _id: string;
    name: string;
  };
  specifications: {
    topSpeed: number;
    chargingTime: number;
    weight: number;
  };
}

export const vehicleService = {
  getAll: async (params?: any) => {
    const response = await api.get("/vehicles", { params });
    // Backend returns { success: true, data: { vehicles: [...], total, totalPages, currentPage } }
    return (
      response.data.data?.vehicles ||
      response.data.vehicles ||
      response.data.data ||
      response.data
    );
  },

  getById: async (id: string) => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data.data || response.data;
  },

  searchNearby: async (lat: number, lng: number, radius: number) => {
    const response = await api.get(
      `/vehicles/search/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
    );
    return response.data.data || response.data;
  },
};
