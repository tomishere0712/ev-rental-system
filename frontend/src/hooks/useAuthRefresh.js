import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";

export const useAuthRefresh = () => {
  const { token, refreshUser } = useAuthStore();

  useEffect(() => {
    // Only refresh if we have a token
    if (token) {
      refreshUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount, ignore token/refreshUser changes

  return null;
};
