import { useAuthStore } from "@/lib/store/auth";
import { useRouter } from "next/navigation";

export const useAuth = () => {
  const { user, token, setUser, setToken } = useAuthStore();
  const router = useRouter();

  const logout = () => {
    setUser(null);
    setToken(null);
    router.push("/auth/signin");
  };

  return { user, token, setUser, setToken, logout };
};