import api from "./api";

export interface Station {
  _id: string;
  name: string;
  code: string;
  address: {
    street: string;
    ward?: string;
    district: string;
    city: string;
    country: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude] - old format
  };
  operatingHours?: {
    open?: string;
    close?: string;
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };
  contactPhone?: string;
  phone?: string;
  email?: string;
  facilities: string[];
  totalParkingSpots?: number;
  chargingStations?: number;
  images?: string[];
  isActive?: boolean;
}

export const stationService = {
  getAll: async () => {
    const response = await api.get("/stations");
    // Backend returns { success: true, data: { stations: [...], total } }
    return (
      response.data.data?.stations ||
      response.data.stations ||
      response.data.data ||
      response.data
    );
  },

  getById: async (id: string) => {
    const response = await api.get(`/stations/${id}`);
    return response.data.data || response.data;
  },

  getVehicles: async (id: string, status = "available") => {
    const response = await api.get(`/stations/${id}/vehicles?status=${status}`);
    return response.data.data || response.data;
  },

  searchNearby: async (
    latitude: number,
    longitude: number,
    maxDistance = 5000
  ) => {
    const response = await api.get(
      `/stations/search/nearby?lat=${latitude}&lng=${longitude}&maxDistance=${maxDistance}`
    );
    return response.data.data || response.data;
  },
};
