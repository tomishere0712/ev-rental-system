import api from "./api";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

export interface User {
  _id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  isVerified: boolean;
  documents?: {
    identityCard?: {
      front: string;
      back: string;
    };
    drivingLicense?: {
      front: string;
      back: string;
    };
  };
}

export const authService = {
  login: async (credentials: LoginCredentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  register: async (data: RegisterData) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await api.put("/auth/profile", data);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};
