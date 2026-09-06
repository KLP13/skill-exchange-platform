import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { authApi, type AuthUser } from "@/services/authApi";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requestSignupVerification: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; message: string; email: string }>;
  verifySignupOtp: (email: string, otp: string) => Promise<AuthUser>;
  login: (email: string, password: string) => Promise<AuthUser>;
  loginWithGoogle: (payload: {
    credential?: string;
    idToken?: string;
    accessToken?: string;
    email?: string;
    name?: string;
    avatar?: string;
    googleId?: string;
  }) => Promise<AuthUser>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("skillswap_auth_token");
  });

  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem("skillswap_auth_user");
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync token and load fresh user profile on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("skillswap_auth_token");
    if (!savedToken) {
      setIsLoading(false);
      return;
    }

    authApi
      .getMe()
      .then((res) => {
        if (res.success && res.data) {
          setUser(res.data);
          localStorage.setItem("skillswap_auth_user", JSON.stringify(res.data));
        }
      })
      .catch(() => {
        // Token invalid or expired
        setToken(null);
        setUser(null);
        localStorage.removeItem("skillswap_auth_token");
        localStorage.removeItem("skillswap_auth_user");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const saveAuthSession = (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("skillswap_auth_token", newToken);
    localStorage.setItem("skillswap_auth_user", JSON.stringify(newUser));
  };

  const requestSignupVerification = async (
    fullName: string,
    email: string,
    password: string
  ) => {
    const res = await authApi.requestSignupVerification(fullName, email, password);
    return {
      success: res.success,
      message: res.message,
      email: res.data?.email || email,
    };
  };

  const verifySignupOtp = async (email: string, otp: string) => {
    const res = await authApi.verifySignupOtp(email, otp);
    saveAuthSession(res.data.token, res.data.user);
    return res.data.user;
  };

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    saveAuthSession(res.data.token, res.data.user);
    return res.data.user;
  };

  const loginWithGoogle = async (payload: {
    credential?: string;
    idToken?: string;
    accessToken?: string;
    email?: string;
    name?: string;
    avatar?: string;
    googleId?: string;
  }) => {
    const res = await authApi.googleAuth(payload);
    saveAuthSession(res.data.token, res.data.user);
    return res.data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("skillswap_auth_token");
    localStorage.removeItem("skillswap_auth_user");
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem("skillswap_auth_user", JSON.stringify(res.data));
      }
    } catch {
      // Ignored
    }
  };

  const updateUser = (partial: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...partial };
      localStorage.setItem("skillswap_auth_user", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        requestSignupVerification,
        verifySignupOtp,
        login,
        loginWithGoogle,
        logout,
        refreshUser,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
