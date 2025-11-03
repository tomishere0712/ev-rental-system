import api from "./api";

export interface Station {
  _id: string;
  name: string;
  code: string;
  address: {
    street: string;
    district: string;
    city: string;
    country: string;
  };
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  operatingHours: {
    open: string;
    close: string;
  };
  contactPhone: string;
  facilities: string[];
}

export const stationService = {
  getAll: async () => {
    const response = await api.get("/stations");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/stations/${id}`);
    return response.data;
  },

  getVehicles: async (id: string, status = "available") => {
    const response = await api.get(`/stations/${id}/vehicles?status=${status}`);
    return response.data;
  },

  searchNearby: async (
    latitude: number,
    longitude: number,
    maxDistance = 5000
  ) => {
    const response = await api.get(
      `/stations/search/nearby?lat=${latitude}&lng=${longitude}&maxDistance=${maxDistance}`
    );
    return response.data;
  },
};
