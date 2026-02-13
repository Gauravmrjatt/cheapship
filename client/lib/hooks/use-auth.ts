import { useAuthStore } from "@/lib/store/auth";

export const useAuth = () => {
  const { user, token, setUser, setToken } = useAuthStore();
  return { user, token, setUser, setToken };
};