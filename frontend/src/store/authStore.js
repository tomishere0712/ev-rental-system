import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authService } from "../services";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setAuth: (user, token) => set({ user, token }),

      logout: () => set({ user: null, token: null }),

      updateUser: (userData) =>
        set((state) => ({
          user: { ...state.user, ...userData },
        })),

      refreshUser: async () => {
        try {
          const token = get().token;
          if (!token) return;
          
          const response = await authService.getMe();
          if (response.success && response.data) {
            set({ user: response.data });
          }
        } catch (error) {
          console.error("Failed to refresh user:", error);
          // If token is invalid, logout
          if (error.response?.status === 401) {
            set({ user: null, token: null });
          }
        }
      },
    }),
    {
      name: "auth-storage",
    }
  )
);
