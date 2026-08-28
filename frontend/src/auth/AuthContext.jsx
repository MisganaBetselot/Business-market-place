import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { tokenStorage } from "../api/client";
import * as authApi from "../api/auth";
import * as usersApi from "../api/users";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const data = await usersApi.getMe();
      setUser(data);
    } catch {
      setUser(null);
      tokenStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tokenStorage.getAccess()) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    tokenStorage.set(data.access, data.refresh);
    await fetchMe();
    return data;
  };

  const register = async (payload) => {
    const data = await authApi.register(payload);
    tokenStorage.set(data.access, data.refresh);
    await fetchMe();
    return data;
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  const updateProfile = async (payload) => {
    const data = await usersApi.updateMe(payload);
    setUser(data);
    return data;
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: !!user?.is_admin,
    login,
    register,
    logout,
    updateProfile,
    refresh: fetchMe,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
