import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserProfile, useGetMe, setAuthTokenGetter, useLoginUser, useRegisterUser, useLogoutUser, LoginBody, RegisterBody, getGetMeQueryKey } from "@workspace/api-client-react";

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginBody) => Promise<void>;
  register: (data: RegisterBody) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

setAuthTokenGetter(() => localStorage.getItem("accessToken"));

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("accessToken"));
  
  const { data: user, isLoading: isUserLoading, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: getGetMeQueryKey(),
    }
  });

  const loginMutation = useLoginUser();
  const registerMutation = useRegisterUser();
  const logoutMutation = useLogoutUser();

  useEffect(() => {
    if (token) {
      localStorage.setItem("accessToken", token);
    } else {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  }, [token]);

  const login = async (data: LoginBody) => {
    const res = await loginMutation.mutateAsync({ data });
    setToken(res.accessToken);
    localStorage.setItem("refreshToken", res.refreshToken);
    await refetch();
  };

  const register = async (data: RegisterBody) => {
    const res = await registerMutation.mutateAsync({ data });
    setToken(res.accessToken);
    localStorage.setItem("refreshToken", res.refreshToken);
    await refetch();
  };

  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isAuthenticated: !!user,
        isLoading: isUserLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
