import { useEffect, useState, useCallback, useRef } from "react";
import { AuthContext } from "./AuthContext";
import { tokenStorage } from "../api/client";
import * as authApi from "../api/auth";
import * as usersApi from "../api/users";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);

  const initialize = useCallback(async () => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (tokenStorage.getAccess()) {
      try {
        const data = await usersApi.getMe();
        setUser(data);
      } catch {
        setUser(null);
        tokenStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Auth state initialization on mount is standard and intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    initialize();
  }, [initialize]);

  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    tokenStorage.set(data.access, data.refresh);
    const me = await usersApi.getMe();
    setUser(me);
    return data;
  };

  const register = async (payload) => {
    const data = await authApi.register(payload);
    tokenStorage.set(data.access, data.refresh);
    const me = await usersApi.getMe();
    setUser(me);
    return data;
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  const updateProfile = async (payload) => {
    const data = await usersApi.updateMe(payload);
    setUser((prev) => ({ ...prev, ...data }));
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
    refresh: initialize,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
